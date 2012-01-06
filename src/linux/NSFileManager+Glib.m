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

#import "NSFileManager+Glib.h"
#import "TZFoundation.h"

@implementation NSFileManager(Glib)

- (NSString*) createTempDirectoryWithError:(NSError**)error {
    NSString *result = nil;
#if GLIB_CHECK_VERSION (2, 30, 0)
    GError *gerror = NULL;
    gchar *dir = g_dir_make_tmp ("tikzitXXXXXX", &gerror);
    GErrorToNSError (gerror, error);
    if (dir)
        result = [NSString stringWithGlibFilename:dir];
    g_free (dir);
#else
//#if (!GLIB_CHECK_VERSION (2, 26, 0))
#define g_mkdtemp mkdtemp
//#endif
    gchar *dir = g_build_filename (g_get_tmp_dir(), "tikzitXXXXXX", NULL);
    gchar *rdir = g_mkdtemp (dir);
    if (rdir) {
        result = [NSString stringWithGlibFilename:dir];
    } else if (error) {
        *error = [NSError errorWithLibcError:errno];
    }
    g_free (dir);
#endif
    return result;
}

- (NSString*) createTempDirectory {
    return [self createTempDirectoryWithError:NULL];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
