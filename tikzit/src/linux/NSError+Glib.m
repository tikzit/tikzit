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

#import "NSError+Glib.h"
#import "TZFoundation.h"

@implementation NSError(Glib)
+ (id) errorWithGError:(GError*)gerror {
    if (!gerror)
        return nil;

    NSString *message = [NSString stringWithUTF8String:gerror->message];
    NSString *domain = [NSString stringWithUTF8String:g_quark_to_string(gerror->domain)];

    NSMutableDictionary *errorDetail = [NSMutableDictionary dictionaryWithObject:message
                                                                          forKey:NSLocalizedDescriptionKey];
    return [self errorWithDomain:domain code:gerror->code userInfo:errorDetail];
}
@end

void GErrorToNSError(GError *errorIn, NSError **errorOut)
{
    if (errorOut && errorIn) {
        *errorOut = [NSError errorWithGError:errorIn];
    }
}

void logGError (GError *error, NSString *message) {
    if (message == nil) {
        NSLog (@"%s", error->message);
    } else {
        NSLog (@"%@: %s", message, error->message);
    }
}

// vim:ft=objc:ts=8:et:sts=4:sw=4
