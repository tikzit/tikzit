#!/usr/bin/env python

from gh import gh, pr
import sys, os

filter = None
if len(sys.argv) == 2:
	filter = sys.argv[1]

tok = os.getenv('GITHUB_TOKEN')

draft = [r for r in gh('releases') if r['draft']][0]

for a in draft['assets']:
	if filter == None or filter in a['name']:
		print('Downloading ' + a['name'])
		b = gh('releases/assets/%s?access_token=%s' % (a['id'], tok),
			   ['-L', '-H', 'Accept: application/octet-stream'],
			   parse=False, quiet=False, auth=False)
		f = open(a['name'], 'w')
		f.write(b)
		f.close()
