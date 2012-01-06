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

#import "TZFoundation.h"
#import <gtk/gtk.h>

@interface FileChooserDialog: NSObject {
    GtkFileChooser *dialog;
}

+ (FileChooserDialog*) saveDialog;
+ (FileChooserDialog*) saveDialogWithParent:(GtkWindow*)parent;
+ (FileChooserDialog*) saveDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent;
+ (FileChooserDialog*) openDialog;
+ (FileChooserDialog*) openDialogWithParent:(GtkWindow*)parent;
+ (FileChooserDialog*) openDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent;

- (id) initSaveDialog;
- (id) initSaveDialogWithParent:(GtkWindow*)parent;
- (id) initSaveDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent;
- (id) initOpenDialog;
- (id) initOpenDialogWithParent:(GtkWindow*)parent;
- (id) initOpenDialogWithTitle:(NSString*)title parent:(GtkWindow*)parent;

- (void) addStandardFilters;
- (void) addFileFilter:(NSString*)filterName withPattern:(NSString*)filePattern;
- (void) addFileFilter:(NSString*)filterName withPattern:(NSString*)filePattern setSelected:(BOOL)selected;

- (void) setCurrentFolder:(NSString*)path;
- (NSString*) currentFolder;

- (void) setSuggestedName:(NSString*)fileName;

- (NSString*) filePath;

- (BOOL) showDialog;

- (void) destroy;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
