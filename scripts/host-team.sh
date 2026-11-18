#!/usr/bin/env bash
# Sets up a new team's site on YOUR Vercel account, for when you host it for them.
#
#   scripts/host-team.sh <site-name>        e.g. scripts/host-team.sh rehearsal-moonlight
#
# What it does (about two minutes):
#   1. creates a Vercel project <site-name> that builds from this template's GitHub repo,
#      so every push to main updates every team's site at once
#   2. creates the team's own Neon database (free plan) and connects it
#   3. sets a temporary admin password and deploys
#   4. prints the address and the temporary password to send to the team
#
# The team changes the password on /admin the first time they sign in. If they forget it
# later, see "Hosting for other teams" in docs/HOSTING.md.
#
# Needs: Node, and the Vercel CLI signed in to your account (npx vercel whoami).
set -euo pipefail

NAME="${1:-}"
REPO="${TEMPLATE_REPO:-mooque-dev/rehearsal-scheduler-template}"
V=(npx --yes vercel)

if [[ ! "$NAME" =~ ^[a-z0-9][a-z0-9-]{1,50}[a-z0-9]$ ]]; then
  echo "Usage: $0 <site-name>   (lowercase letters, numbers and dashes; becomes <site-name>.vercel.app)" >&2
  exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"

if "${V[@]}" api "/v9/projects/$NAME" --raw >/dev/null 2>&1; then
  echo "You already have a Vercel project called $NAME. Pick another name." >&2
  exit 1
fi

PASSWORD="$(node -e '
const { randomInt } = require("crypto");
const abc = "abcdefghjkmnpqrstuvwxyz23456789";
const g = () => Array.from({ length: 4 }, () => abc[randomInt(abc.length)]).join("");
process.stdout.write(`${g()}-${g()}-${g()}`);')"

echo "1/4  Creating the project $NAME …"
node -e '
const [name, repo, password] = process.argv.slice(1);
process.stdout.write(JSON.stringify({
  name,
  framework: "nextjs",
  gitRepository: { type: "github", repo },
  environmentVariables: [
    { key: "ADMIN_PASSWORD", value: password, type: "encrypted", target: ["production", "preview"] },
    { key: "ADMIN_PASSWORD_IS_TEMPORARY", value: "1", type: "plain", target: ["production", "preview"] },
  ],
}));' "$NAME" "$REPO" "$PASSWORD" > project-body.json
"${V[@]}" api /v11/projects -X POST --input project-body.json --raw > project.json
rm project-body.json
REPO_ID="$(node -e 'const p = require("./project.json"); if (!p.link?.repoId) { console.error(JSON.stringify(p)); process.exit(1); } process.stdout.write(String(p.link.repoId));')"
"${V[@]}" link --yes --project "$NAME" >/dev/null 2>&1

echo "2/4  Creating its database …"
"${V[@]}" integration add neon --name "$NAME-db" --billing-plan free_v3 --no-env-pull

echo "3/4  Deploying (about a minute) …"
node -e '
const [name, repoId] = process.argv.slice(1);
process.stdout.write(JSON.stringify({
  name, project: name, target: "production",
  gitSource: { type: "github", repoId: Number(repoId), ref: "main" },
}));' "$NAME" "$REPO_ID" > deploy-body.json
"${V[@]}" api /v13/deployments -X POST --input deploy-body.json --raw > deploy.json
DEPLOY_ID="$(node -e 'const d = require("./deploy.json"); if (!d.id) { console.error(JSON.stringify(d)); process.exit(1); } process.stdout.write(d.id);')"

state=""
for _ in $(seq 1 60); do
  sleep 5
  state="$("${V[@]}" api "/v13/deployments/$DEPLOY_ID" --raw 2>/dev/null | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{try{process.stdout.write(JSON.parse(s).readyState||"")}catch{}})')"
  [[ "$state" == "READY" || "$state" == "ERROR" || "$state" == "CANCELED" ]] && break
done
if [[ "$state" != "READY" ]]; then
  echo "The deploy did not finish (state: ${state:-unknown}). Check it at https://vercel.com/dashboard — project $NAME." >&2
  exit 1
fi

echo "4/4  Checking the site …"
SITE="$("${V[@]}" api "/v9/projects/$NAME" --raw | node -e '
let s=""; process.stdin.on("data",c=>s+=c).on("end",()=>{
  const p = JSON.parse(s);
  const aliases = p.targets?.production?.alias ?? [];
  const short = aliases.filter(a => a.endsWith(".vercel.app")).sort((a, b) => a.length - b.length)[0];
  process.stdout.write(short ?? aliases[0] ?? "");
});')"
code="$(curl -s -o /dev/null -w '%{http_code}' "https://$SITE/admin" || true)"

cat <<EOF

Done. ($NAME, admin page answered HTTP $code)

  Schedule (for the whole team):  https://$SITE
  Admin (for the organiser):      https://$SITE/admin
  Temporary admin password:       $PASSWORD

Send the organiser the admin link and the password privately (not in the group chat).
They'll be asked to change the password the first time they sign in.
EOF
