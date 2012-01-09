/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
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

#import "NSError+Tikzit.h"

NSString* const TZErrorDomain = @"tikzit";

NSString* const TZToolOutputErrorKey = @"tool-output";

@implementation NSError(Tikzit)
+ (NSString*)tikzitErrorDomain {
    return TZErrorDomain;
}

+ (id) errorWithMessage:(NSString*)message code:(NSInteger)code cause:(NSError*)cause {
    NSMutableDictionary *errorDetail = [NSMutableDictionary dictionaryWithCapacity:2];
    [errorDetail setValue:message forKey:NSLocalizedDescriptionKey];
    if (cause)
		[errorDetail setValue:cause forKey:NSUnderlyingErrorKey];
    return [self errorWithDomain:TZErrorDomain code:code userInfo:errorDetail];
}

+ (id) errorWithMessage:(NSString*)message code:(NSInteger)code {
    NSMutableDictionary *errorDetail = [NSMutableDictionary dictionaryWithObject:message
																		  forKey:NSLocalizedDescriptionKey];
    return [self errorWithDomain:TZErrorDomain code:code userInfo:errorDetail];
}

+ (id) errorWithLibcError:(NSInteger)errnum {
    NSString *message = [NSString stringWithUTF8String:strerror(errnum)];
    NSMutableDictionary *errorDetail = [NSMutableDictionary dictionaryWithObject:message
																		  forKey:NSLocalizedDescriptionKey];
    return [self errorWithDomain:NSPOSIXErrorDomain code:errnum userInfo:errorDetail];
}

- (NSString*)toolOutput {
    return [[self userInfo] objectForKey:TZToolOutputErrorKey];
}

@end

void logError (NSError *error, NSString *message) {
    if (message == nil) {
		NSLog (@"%@", [error localizedDescription]);
    } else {
		NSLog (@"%@: %@", message, [error localizedDescription]);
    }
}

// vi:ft=objc:ts=4:noet:sts=4:sw=4
