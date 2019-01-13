import sys, re
from gh import gh, get_release

if len(sys.argv) != 2:
    print("Usage: python gh-push.py FILENAME")
    sys.exit(1)

f = sys.argv[1]

print('Pulling info on release AUTO.')
draft = get_release('AUTO')

existing = [a for a in draft['assets'] if a['name'] == f]
if (len(existing) > 0):
    print('Asset exists, deleting.')
    gh('releases/assets/' + str(existing[0]['id']),
        ['-X', 'DELETE'])

print('Uploading new asset...')

upload_url = re.sub(
    '\\{.*\\}', '?name=' + f,
    draft['upload_url'])

resp = gh(upload_url, [
    '-H', 'Content-type: application/octet-stream',
    '--data-binary', f
    ])

print('Done.')
