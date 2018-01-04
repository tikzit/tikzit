//
//  osx.m
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
#import "test/test.h"

#import  <Cocoa/Cocoa.h>

void testOSX() {
//	char template[] = "/tmp/tikzit_test_tmp_XXXXXXX";
//	char *dir = mkdtemp(template);
//	NSString *tempDir = [NSString stringWithUTF8String:dir];
//	
//	NSString *testLatex =
//	@"\\documentclass{article}\n"
//	@"\\begin{document}\n"
//	@"test document\n"
//	@"\\end{document}\n";
//	
//	NSString *texFile = [NSString stringWithFormat:@"%@/test.tex", tempDir];
//	NSString *pdfFile = [NSString stringWithFormat:@"%@/test.pdf", tempDir];
//	
//	[testLatex writeToFile:texFile atomically:NO encoding:NSUTF8StringEncoding error:NULL];
//	
//	NSTask *task = [[NSTask alloc] init];
//	[task setLaunchPath:@"/bin/bash"];
//	NSPipe *inpt = [NSPipe pipe];
//	NSPipe *outpt = [NSPipe pipe];
//	[task setStandardInput:inpt];
//	[task setStandardOutput:outpt];
//	
//	[task launch];
//	
//	NSFileHandle *wr = [inpt fileHandleForWriting];
//	NSString *cmd =
//	[NSString stringWithFormat:
//	 @"if [ -e ~/.profile ]; then source ~/.profile; fi"
//	 @"if [ -e ~/.profile ]; then source ~/.profile; fi";
//	[wr writeData:[cmd dataUsingEncoding:NSUTF8StringEncoding]];
//	[wr closeFile];
//	
//	NSFileHandle *rd = [outpt fileHandleForReading];
//	NSString *res = [[NSString alloc] initWithData:[rd readDataToEndOfFile]
//										  encoding:NSUTF8StringEncoding];
//	NSLog(@"got:\n %@", res);
}
