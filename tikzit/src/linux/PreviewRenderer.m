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

@implementation PreviewRenderer

- (id) init {
    [self release];
    self = nil;
    return nil;
}

- (id) initWithPreambles:(Preambles*)p {
    self = [super init];

    if (self) {
        document = nil;
        preambles = [p retain];
        pdfDocument = NULL;
        pdfPage = NULL;
    }

    return self;
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

    // run pdflatex in a bash shell
    NSTask *latexTask = [[NSTask alloc] init];
    [latexTask setCurrentDirectoryPath:tempDir];
    // GNUStep is clever enough to use PATH
    [latexTask setLaunchPath:@"pdflatex"];

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

    [latexTask launch];
    [latexTask waitUntilExit];

    NSData *data = [latexOut readDataToEndOfFile];
    NSString *str = [[NSString alloc] initWithData:data
                                          encoding:NSUTF8StringEncoding];

    BOOL success = NO;

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

- (Preambles*) preambles {
    return preambles;
}

- (TikzDocument*) document {
    return document;
}

- (void) setDocument:(TikzDocument*)doc {
    [doc retain];
    [document release];
    document = doc;
}

- (double) width {
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
}

- (void) renderWithContext:(id<RenderContext>)c onSurface:(id<Surface>)surface {
    if (document != nil) {
        CairoRenderContext *context = (CairoRenderContext*)c;

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
