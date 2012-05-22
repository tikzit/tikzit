/*
 * Copyright 2011  Alex Merry <dev@randomguy3.me.uk>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation; either version 2 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#import "PreviewRenderer.h"

#import "CairoRenderContext.h"
#import "Configuration.h"
#import "Preambles.h"
#import "TikzDocument.h"

@implementation PreviewRenderer

@synthesize preambles, document;
@synthesize width, height;

- (id) init {
    [self release];
    self = nil;
    return nil;
}

- (id) initWithPreambles:(Preambles*)p config:(Configuration*)c {
    self = [super init];

    if (self) {
        document = nil;
        config = [c retain];
        preambles = [p retain];
        pdfDocument = NULL;
        pdfPage = NULL;
        width = 150.0;
        height = 150.0;
    }

    return self;
}

- (void) dealloc {
    [document release];
    [config release];
    [preambles release];

    if (pdfDocument) {
        g_object_unref (pdfDocument);
        pdfDocument = NULL;
    }
    if (pdfPage) {
        g_object_unref (pdfPage);
        pdfPage = NULL;
    }

    [super dealloc];
}

- (BOOL) update {
    NSError *error = nil;
    BOOL result = [self updateWithError:&error];
    if (error) {
        logError (error, @"Could not update preview");
        if ([error code] == TZ_ERR_TOOL_FAILED) {
            NSLog (@"Output: %@", [[error userInfo] objectForKey:TZToolOutputErrorKey]);
        }
    }
    return result;
}

- (BOOL) updateWithError:(NSError**)error {
    if (document == nil) {
        if (error) {
            *error = [NSError errorWithMessage:@"No document given" code:TZ_ERR_BADSTATE];
        }
        if (pdfDocument) {
            g_object_unref (pdfDocument);
            pdfDocument = NULL;
        }
        if (pdfPage) {
            g_object_unref (pdfPage);
            pdfPage = NULL;
        }
        return NO;
    }

    NSString *tex = [NSString stringWithFormat:@"%@%@%@",
                        [preambles currentPreamble],
                        [document tikz],
                        [preambles currentPostamble]];

    NSString *tempDir = [[NSFileManager defaultManager] createTempDirectoryWithError:error];
    if (!tempDir) {
        if (error) {
            *error = [NSError errorWithMessage:@"Could not create temporary directory" code:TZ_ERR_IO cause:*error];
        }
        return NO;
    }

    // write tex code to temporary file
    NSString *texFile = [NSString stringWithFormat:@"%@/tikzit.tex", tempDir];
    NSString *pdfFile = [NSString stringWithFormat:@"file://%@/tikzit.pdf", tempDir];
    [tex writeToFile:texFile atomically:YES];

    NSTask *latexTask = [[NSTask alloc] init];
    [latexTask setCurrentDirectoryPath:tempDir];

    // GNUStep is clever enough to use PATH
    NSString *path = [config stringEntry:@"pdflatex"
                                 inGroup:@"Previews"
                             withDefault:@"pdflatex"];
    [latexTask setLaunchPath:path];

    NSArray *args = [NSArray arrayWithObjects:
        @"-fmt=latex",
        @"-output-format=pdf",
        @"-interaction=nonstopmode",
        @"-halt-on-error",
        texFile,
        nil];
    [latexTask setArguments:args];

    NSPipe *pout = [NSPipe pipe];
    [latexTask setStandardOutput:pout];

    NSFileHandle *latexOut = [pout fileHandleForReading];

    BOOL success = NO;

    NS_DURING {
        [latexTask launch];
        [latexTask waitUntilExit];
    } NS_HANDLER {
        NSLog(@"Failed to run '%@'; error was: %@", path, [localException reason]);
        (void)localException;
        NSString *desc = [NSString stringWithFormat:@"Failed to run '%@'", path];
        NSMutableDictionary *errorDetail = [NSMutableDictionary dictionaryWithCapacity:2];
        [errorDetail setValue:desc forKey:NSLocalizedDescriptionKey];
        *error = [NSError errorWithDomain:TZErrorDomain code:TZ_ERR_IO userInfo:errorDetail];

        // remove all temporary files
        [[NSFileManager defaultManager] removeFileAtPath:tempDir handler:NULL];

        return NO;
    } NS_ENDHANDLER

    NSData *data = [latexOut readDataToEndOfFile];
    NSString *str = [[NSString alloc] initWithData:data
                                          encoding:NSUTF8StringEncoding];

    if ([latexTask terminationStatus] != 0) {
        if (error) {
            NSMutableDictionary *errorDetail = [NSMutableDictionary dictionaryWithCapacity:2];
            [errorDetail setValue:@"Generating a PDF file with pdflatex failed" forKey:NSLocalizedDescriptionKey];
            [errorDetail setValue:str forKey:TZToolOutputErrorKey];
            *error = [NSError errorWithDomain:TZErrorDomain code:TZ_ERR_TOOL_FAILED userInfo:errorDetail];
        }
    } else {
        // load pdf document
        GError* gerror = NULL;
        pdfDocument = poppler_document_new_from_file([pdfFile UTF8String], NULL, &gerror);
        if (!pdfDocument) {
            if (error) {
                *error = [NSError errorWithMessage:[NSString stringWithFormat:@"Could not load PDF document", pdfFile]
                                              code:TZ_ERR_IO
                                             cause:[NSError errorWithGError:gerror]];
            }
            g_error_free(gerror);
        } else {
            pdfPage = poppler_document_get_page(pdfDocument, 0);
            if(!pdfPage) {
                if (error) {
                    *error = [NSError errorWithMessage:@"Could not open first page of PDF document"
                                                  code:TZ_ERR_OTHER];
                }
                g_object_unref(pdfDocument);
            } else {
                success = YES;
            }
        }
    }

    // remove all temporary files
    [[NSFileManager defaultManager] removeFileAtPath:tempDir handler:NULL];

    return success;
}

- (BOOL) isValid {
    return pdfPage ? YES : NO;
}

/*- (double) width {
    double w = 0.0;
    if (pdfPage)
        poppler_page_get_size(pdfPage, &w, NULL);
    return w;
}

- (double) height {
    double h = 0.0;
    if (pdfPage)
        poppler_page_get_size(pdfPage, NULL, &h);
    return h;
}*/

- (void) renderWithContext:(id<RenderContext>)c onSurface:(id<Surface>)surface {
    if (document != nil && pdfPage) {
        CairoRenderContext *context = (CairoRenderContext*)c;
        
        double w = 0.0;
        double h = 0.0;
        poppler_page_get_size(pdfPage, &w, &h);
        if (w==0) w = 1.0;
        if (h==0) h = 1.0;

        double scale = ([self height] / h) * 0.95;
        if (w * scale > [self width]) scale = [self width] / w;
        [[surface transformer] setScale:scale];

        NSPoint origin;
        w *= scale;
        h *= scale;
        origin.x = ([self width] - w) / 2;
        origin.y = ([self height] - h) / 2;

        [[surface transformer] setOrigin:origin];

        [context saveState];
        [context applyTransform:[surface transformer]];

        // white-out
        [context paintWithColor:WhiteRColor];

        poppler_page_render (pdfPage, [context cairoContext]);

        [context restoreState];
    }
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
