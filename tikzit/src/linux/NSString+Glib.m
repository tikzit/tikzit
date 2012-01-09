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

#import "NSString+Glib.h"
#import "TZFoundation.h"

@implementation NSString(Glib)
+ (id) stringWithGlibFilename:(const gchar *)filename {
    return [[[self alloc] initWithGlibFilename:filename] autorelease];
}

- (id) initWithGlibFilename:(const gchar *)filename {
    if (self == nil) {
        return nil;
    }

    if (filename == NULL) {
        [self release];
        return nil;
    }

    GError *error = NULL;
    gchar *utf8file = g_filename_to_utf8 (filename, -1, NULL, NULL, &error);
    if (utf8file == NULL) {
        if (error)
            logGError (error, @"Failed to convert a GLib filename to UTF8");
        [self release];
        return nil;
    }

    self = [self initWithUTF8String:utf8file];
    g_free (utf8file);

    return self;
}

- (gchar*)glibFilenameWithError:(NSError**)error {
    GError *gerror = NULL;
    gchar *result = g_filename_from_utf8 ([self UTF8String], -1, NULL, NULL, &gerror);
    GErrorToNSError (gerror, error);
    if (gerror) {
        logGError (gerror, @"Failed to convert a UTF8 string to a GLib filename");
    }
    return result;
}

- (gchar*)glibFilename {
    return [self glibFilenameWithError:NULL];
}

- (gchar*)glibUriWithError:(NSError**)error {
    gchar *filepath;
    gchar *uri;
    NSError *cause = nil;

    filepath = [self glibFilenameWithError:&cause];
    if (!filepath) {
        if (error) {
            NSString *message = [NSString stringWithFormat:@"Could not convert \"%@\" to the GLib filename encoding", self];
            *error = [NSError errorWithMessage:message code:TZ_ERR_OTHER cause:cause];
        }
        return NULL;
    }

    GError *gerror = NULL;
    GError **gerrorptr = error ? &gerror : NULL;
    uri = g_filename_to_uri (filepath, NULL, gerrorptr);
    if (!uri && error) {
        NSString *message = [NSString stringWithFormat:@"Could not convert \"%@\" to a GLib URI", self];
        *error = [NSError errorWithMessage:message code:TZ_ERR_BADFORMAT cause:[NSError errorWithGError:gerror]];
    }
    g_free (filepath);
    return uri;
}

- (gchar*)glibUri {
    return [self glibUriWithError:NULL];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
