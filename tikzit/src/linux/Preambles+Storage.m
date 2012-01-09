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

#import "Preambles+Storage.h"

static NSString *ext = @"preamble";

@implementation Preambles (Storage)

+ (Preambles*) preamblesFromDirectory:(NSString*)directory {
    return [[[self alloc] initFromDirectory:directory] autorelease];
}

- (id) initFromDirectory:(NSString*)directory {
    BOOL isDir = NO;
    if ([[NSFileManager defaultManager] fileExistsAtPath:directory isDirectory:&isDir] && isDir) {
        self = [super init];

        if (self) {
            selectedPreambleName = @"default";
            preambleDict = nil;
            [self loadFromDirectory:directory];
        }
    } else {
        self = [self init];
    }

    return self;
}

- (void) loadFromDirectory:(NSString*)directory {
    preambleDict = [[NSMutableDictionary alloc] initWithCapacity:1];
    NSDirectoryEnumerator *en = [[NSFileManager defaultManager] enumeratorAtPath:directory];
    NSString *filename;
    while ((filename = [en nextObject]) != nil) {
        if ([filename hasSuffix:ext] && [[en fileAttributes] fileType] == NSFileTypeRegular) {
            NSString *path = [directory stringByAppendingPathComponent:filename];
            NSString *contents = [NSString stringWithContentsOfFile:path];
            if (contents) {
                [preambleDict setObject:contents forKey:[filename stringByDeletingPathExtension]];
            }
        }
    }
}

- (void) storeToDirectory:(NSString*)directory {
    NSDirectoryEnumerator *den = [[NSFileManager defaultManager] enumeratorAtPath:directory];
    NSString *filename;
    while ((filename = [den nextObject]) != nil) {
        if ([filename hasSuffix:ext] && [[den fileAttributes] fileType] == NSFileTypeRegular) {
            NSString *path = [directory stringByAppendingPathComponent:filename];
            NSString *entry = [filename stringByDeletingPathExtension];
            if ([preambleDict objectForKey:entry] == nil) {
                [[NSFileManager defaultManager] removeFileAtPath:path handler:nil];
            }
        }
    }

    NSEnumerator *en = [self customPreambleNameEnumerator];
    NSString *entry;
    while ((entry = [en nextObject]) != nil) {
        NSString *path = [directory stringByAppendingPathComponent:[entry stringByAppendingPathExtension:ext]];
        NSString *contents = [preambleDict objectForKey:entry];
        [contents writeToFile:path atomically:YES];
    }
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
