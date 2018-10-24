#!/usr/bin/python

import sys
import subprocess

if len(sys.argv) >= 3:
	file = sys.argv[1]
	line = sys.argv[2]

	print(file)
	print(line)

	if file.endswith('.tikz'):
		subprocess.call(['tikzit', file])
	else:
		subprocess.call(['subl', file + ':' + line])
