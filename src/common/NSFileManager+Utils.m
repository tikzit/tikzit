//
//  MainWindow.h
//  TikZiT
//
//  Copyright 2010 Alex Merry
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

#import <Foundation/Foundation.h>
#import "NSError+Tikzit.h"

@implementation NSFileManager(Utils)
- (BOOL) ensureDirectoryExists:(NSString*)directory error:(NSError**)error {
    BOOL isDirectory = NO;
    if (![self fileExistsAtPath:directory isDirectory:&isDirectory]) {
        if (![self createDirectoryAtPath:directory withIntermediateDirectories:YES attributes:nil error:error]) {
            return NO;
        }
    } else if (!isDirectory) {
        if (error) {
            NSMutableDictionary *errorDetail = [NSMutableDictionary dictionary];
            [errorDetail setValue:@"Directory is a file" forKey:NSLocalizedDescriptionKey];
            [errorDetail setValue:directory forKey:NSFilePathErrorKey];
            *error = [NSError errorWithDomain:TZErrorDomain code:TZ_ERR_NOTDIRECTORY userInfo:errorDetail];
        }
        return NO;
    }
    return YES;
}
@end

// vi:ft=objc:sts=4:sw=4:ts=4:noet
