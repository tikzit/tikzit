#!/usr/bin/env python

import sys, os, re
from gh import gh

if len(sys.argv) != 2:
    print("Usage: python gh-push.py FILENAME")
    sys.exit(1)

f = sys.argv[1]
fname = os.path.basename(f)

print('Pulling info on draft release...')
draft = [r for r in gh('releases') if r['draft']][0]
print('Found: ' + draft['name'])

existing = [a for a in draft['assets'] if a['name'] == fname]
if (len(existing) > 0):
    print('Asset %s exists, deleting.' % fname)
    gh('releases/assets/' + str(existing[0]['id']),
        ['-X', 'DELETE'])

print('Uploading %s...' % f)

upload_url = re.sub(
    '\\{.*\\}', '?name=' + fname,
    draft['upload_url'])

resp = gh(upload_url, [
    '-H', 'Content-type: application/octet-stream',
    '--data-binary', '@' + f
    ])

print('Done.')
