//
//  main.m
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
// 
#include "config.h"
#import "test/test.h"
#include <string.h>
void testCommon();

int main(int argc, char **argv) {
	if (argc == 2 && strcmp(argv[1], "--disable-color")==0) {
		setColorEnabled(NO);
	} else {
		setColorEnabled(YES);
	}
	
	PUTS(@"");
	PUTS(@"**********************************************");
	PUTS(@"TikZiT TESTS, LINUX VERSION %@", VERSION);
	PUTS(@"**********************************************");
	PUTS(@"");
	
	startTests();
	testCommon();
  testLinux();
	
	PUTS(@"");
	PUTS(@"**********************************************");
	endTests();
	PUTS(@"**********************************************");
	PUTS(@"");
}
