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

#import "FileChooserDialog.h"

@implementation FileChooserDialog: NSObject

+ (FileChooserDialog*) saveDialog { return [[[self alloc] initSaveDialog] autorelease]; }
+ (FileChooserDialog*) saveDialogWithParent:(GtkWindow*)parent
    { return [[[self alloc] initSaveDialogWithParent:parent] autorelease]; }
+ (FileChooserDialog*) saveDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent
    { return [[[self alloc] initSaveDialogWithTitle:title parent:parent] autorelease]; }
+ (FileChooserDialog*) openDialog { return [[[self alloc] initOpenDialog] autorelease]; }
+ (FileChooserDialog*) openDialogWithParent:(GtkWindow*)parent
    { return [[[self alloc] initOpenDialogWithParent:parent] autorelease]; }
+ (FileChooserDialog*) openDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent
    { return [[[self alloc] initOpenDialogWithTitle:title parent:parent] autorelease]; }

- (id) initSaveDialog { return [self initSaveDialogWithParent:NULL]; }
- (id) initSaveDialogWithParent:(GtkWindow*)parent
    { return [self initSaveDialogWithTitle:@"Save file" parent:parent]; }
- (id) initSaveDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent {
    self = [super init];

    if (self) {
        dialog = GTK_FILE_CHOOSER (gtk_file_chooser_dialog_new (
                [title UTF8String],
                parent,
                GTK_FILE_CHOOSER_ACTION_SAVE,
                GTK_STOCK_CANCEL, GTK_RESPONSE_CANCEL,
                GTK_STOCK_SAVE, GTK_RESPONSE_ACCEPT,
                NULL));
        gtk_file_chooser_set_do_overwrite_confirmation (dialog, TRUE);
    }

    return self;
}

- (id) initOpenDialog { return [self initOpenDialogWithParent:NULL]; }
- (id) initOpenDialogWithParent:(GtkWindow*)parent
    { return [self initOpenDialogWithTitle:@"Open file" parent:parent]; }
- (id) initOpenDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent {
    self = [super init];

    if (self) {
        dialog = GTK_FILE_CHOOSER (gtk_file_chooser_dialog_new (
                [title UTF8String],
                parent,
                GTK_FILE_CHOOSER_ACTION_OPEN,
                GTK_STOCK_CANCEL, GTK_RESPONSE_CANCEL,
                GTK_STOCK_OPEN, GTK_RESPONSE_ACCEPT,
                NULL));
    }

    return self;
}

- (void) addStandardFilters {
    GtkFileFilter *tikzfilter = gtk_file_filter_new();
    gtk_file_filter_set_name(tikzfilter, ".tikz files");
    gtk_file_filter_add_pattern(tikzfilter, "*.tikz");
    gtk_file_chooser_add_filter(dialog, tikzfilter);
    GtkFileFilter *allfilter = gtk_file_filter_new();
    gtk_file_filter_set_name(allfilter, "all files");
    gtk_file_filter_add_pattern(allfilter, "*");
    gtk_file_chooser_add_filter(dialog, allfilter);
    gtk_file_chooser_set_filter(dialog, tikzfilter);
}

- (void) addFileFilter:(NSString*)filterName withPattern:(NSString*)filePattern {
    [self addFileFilter:filterName withPattern:filePattern setSelected:NO];
}

- (void) addFileFilter:(NSString*)filterName withPattern:(NSString*)filePattern setSelected:(BOOL)selected {
    GtkFileFilter *oldFilter = selected ? NULL : gtk_file_chooser_get_filter (dialog);
    GtkFileFilter *filter = gtk_file_filter_new();
    gtk_file_filter_set_name(filter, [filterName UTF8String]);
    gtk_file_filter_add_pattern(filter, [filePattern UTF8String]);
    gtk_file_chooser_add_filter(dialog, filter);
    if (selected) {
        gtk_file_chooser_set_filter (dialog, filter);
    } else if (oldFilter) {
        gtk_file_chooser_set_filter (dialog, oldFilter);
    }
}

- (void) setCurrentFolder:(NSString*)path {
    gchar *folder = [path glibFilename];
    if (folder) {
        gtk_file_chooser_set_current_folder(dialog, folder);
        g_free (folder);
    }
}

- (NSString*) currentFolder {
    NSString *path = nil;
    gchar *folder = gtk_file_chooser_get_current_folder(dialog);
    if (folder) {
        path = [NSString stringWithGlibFilename:folder];
        g_free (folder);
    }
    return path;
}

- (void) setSuggestedName:(NSString*)fileName {
    gtk_file_chooser_set_current_name (GTK_FILE_CHOOSER (dialog), [fileName UTF8String]);
}

- (NSString*) filePath {
    NSString *path = nil;
    gchar *filename = gtk_file_chooser_get_filename (GTK_FILE_CHOOSER (dialog));
    if (filename) {
        path = [NSString stringWithGlibFilename:filename];
        g_free (filename);
    }
    return path;
}

- (BOOL) showDialog {
    return (gtk_dialog_run (GTK_DIALOG (dialog)) == GTK_RESPONSE_ACCEPT) ? YES : NO;
}

- (void) destroy {
    gtk_widget_destroy (GTK_WIDGET (dialog));
    dialog = NULL;
}

- (void) dealloc {
    if (dialog) {
        g_warning ("Failed to destroy file chooser dialog!\n");
        gtk_widget_destroy (GTK_WIDGET (dialog));
    }
    [super dealloc];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
