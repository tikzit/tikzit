//
//  PreviewController.m
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

#import "PreviewController.h"
#import "AppDelegate.h"
#import "PreambleController.h"
#import <Quartz/Quartz.h>

@implementation PreviewController

static PreviewController *preview = nil;

- (id)initWithWindowNibName:(NSString*)nib
		 preambleController:(PreambleController*)pc
					tempDir:(NSString*)dir {
	[super initWithWindowNibName:nib];
	tempDir = [dir copy];
	typesetCount = 0;
	preambleController = pc;
	latexLock = [[NSLock alloc] init];
	return self;
}

- (void)runLatex:(id)tikz {
	// Only build one tex file at a time, so we don't get funky results.
	//[latexLock lock];
	[progressIndicator startAnimation:self];
    
    if([[NSUserDefaults standardUserDefaults] boolForKey:@"net.sourceforge.tikzit.previewfocus"]){
        [[preview window] makeKeyAndOrderFront:self];
	}
    
	int fnum = typesetCount++;
	
	NSString *tex = [NSString stringWithFormat:@"%@%@%@",
					 [preambleController currentPreamble],
					 tikz,
					 [preambleController currentPostamble]];
	
	NSString *texFile = [NSString stringWithFormat:@"%@/tikzit_%d.tex", tempDir, fnum];
	NSString *pdfFile = [NSString stringWithFormat:@"%@/tikzit_%d.pdf", tempDir, fnum];
	
	[tex writeToFile:texFile atomically:NO encoding:NSUTF8StringEncoding error:NULL];
    
    NSString *pdflatexPath = [[NSUserDefaults standardUserDefaults] stringForKey:@"net.sourceforge.tikzit.pdflatexpath"];
	
	// We run pdflatex in a bash shell to have easy access to the setup from unix-land
	NSTask *latexTask = [[NSTask alloc] init];
	[latexTask setCurrentDirectoryPath:tempDir];
	[latexTask setLaunchPath:@"/bin/bash"];
    
	// This assumes the user has $PATH set up to find pdflatex in either .profile
	// or .bashrc. This should be improved to take other path setups into account
	// and to be customisable.
	NSString *latexCmd =
	[NSString stringWithFormat:
	 @"if [ -e ~/.profile ]; then source ~/.profile; fi\n"
	 @"if [ -e ~/.bashrc ]; then source ~/.bashrc; fi\n"
	 @"%@ -interaction=nonstopmode -output-format=pdf -halt-on-error '%@'\n", pdflatexPath, texFile];
    
    NSLog(@"Telling bash: %@", latexCmd);
	
	NSPipe *pout = [NSPipe pipe];
	NSPipe *pin = [NSPipe pipe];
	[latexTask setStandardOutput:pout];
	[latexTask setStandardInput:pin];
	
	NSFileHandle *latexIn = [pin fileHandleForWriting];
	NSFileHandle *latexOut = [pout fileHandleForReading];
	
	[latexTask launch];
	[latexIn writeData:[latexCmd dataUsingEncoding:NSUTF8StringEncoding]];
	[latexIn closeFile];
    
	
	NSData *data = [latexOut readDataToEndOfFile];
	NSString *str = [[NSString alloc] initWithData:data
										  encoding:NSUTF8StringEncoding];
	
    [latexTask waitUntilExit];
	if ([latexTask terminationStatus] != 0) {
        if ([latexTask terminationStatus] == 127) {
            [errorTextView setHidden:YES];
            [errorText setString:@"\nCouldn't find pdflatex, change settings and try again."];
            [errorTextView setHidden:NO];
        }else{
            [errorTextView setHidden:YES];
            [errorText setString:[@"\nAN ERROR HAS OCCURRED, PDFLATEX SAID:\n\n" stringByAppendingString:str]];
            [errorTextView setHidden:NO];
        }
	} else {
		[errorText setString:@""];
		[errorTextView setHidden:YES];
		
		data = [NSData dataWithContentsOfFile:pdfFile];
		PDFDocument *doc = [[PDFDocument alloc] initWithData:data];
		
		// pad the PDF by a couple of pixels
		if ([doc pageCount] >= 1) {
			PDFPage *page = [doc pageAtIndex:0];
			NSRect box = [page boundsForBox:kPDFDisplayBoxCropBox];
			box.origin.x -= 2.0f;
			box.origin.y -= 2.0f;
			box.size.width += 4.0f;
			box.size.height += 4.0f;
			[page setBounds:box forBox:kPDFDisplayBoxCropBox];
			[page setBounds:box forBox:kPDFDisplayBoxMediaBox];
		}
		
		[pdfView setDocument:doc];
	}
	
	[progressIndicator stopAnimation:self];
	//[latexLock unlock];
}

- (void)buildTikz:(NSString*)tikz {
	// Build on a separate thread to keep the interface responsive.
	[NSThread detachNewThreadSelector:@selector(runLatex:) toTarget:self withObject:tikz];
}

+ (void)setDefaultPreviewController:(PreviewController*)pc {
	preview = pc;
}

+ (PreviewController*)defaultPreviewController {
	return preview;
}


@end
