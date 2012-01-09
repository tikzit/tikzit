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

#import "RecentManager.h"
#import <gtk/gtk.h>

static RecentManager *defMan = nil;

@implementation RecentManager
- (id) init {
    self = [super init];
    return self;
}

+ (RecentManager*) defaultManager {
    if (defMan == nil) {
        defMan = [[self alloc] init];
    }
    return defMan;
}

- (void)addRecentFile:(NSString*)path {
    NSError *error = nil;
    gchar *uri = [path glibUriWithError:&error];
    if (error) {
        logError (error, @"Could not add recent file");
        return;
    }

    GtkRecentData recent_data;
    recent_data.display_name   = NULL;
    recent_data.description    = NULL;
    recent_data.mime_type      = "text/x-tikz";
    recent_data.app_name       = (gchar *) g_get_application_name ();
    recent_data.app_exec       = g_strjoin (" ", g_get_prgname (), "%u", NULL);
    recent_data.groups         = NULL;
    recent_data.is_private     = FALSE;

    gtk_recent_manager_add_full (gtk_recent_manager_get_default(), uri, &recent_data);

    g_free (uri);
    g_free (recent_data.app_exec);
}

- (void)removeRecentFile:(NSString*)path {
    NSError *error = nil;
    gchar *uri = [path glibUriWithError:&error];
    if (error) {
        logError (error, @"Could not remove recent file");
        return;
    }

    gtk_recent_manager_remove_item (gtk_recent_manager_get_default(), uri, NULL);

    g_free (uri);
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
