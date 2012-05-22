/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
 *
 * Stuff stolen from glade-window.c in Glade:
 *     Copyright (C) 2001 Ximian, Inc.
 *     Copyright (C) 2007 Vincent Geddes.
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

@class MainWindow;
@class PickSupport;

/**
 * Manages the menu and toolbar for the main window.
 */
@interface Menu: NSObject {
    MainWindow     *mainWindow;
    GtkUIManager   *ui;
    GtkActionGroup *staticActions;
    GtkActionGroup *documentActions;
//  GtkActionGroup *documents_list_menu_actions;
    GtkAction      *undoAction;
    GtkAction      *redoAction;
    GtkAction      *pasteAction;
    GtkAction     **nodeSelBasedActions;
    guint           nodeSelBasedActionCount;
    GtkAction     **edgeSelBasedActions;
    guint           edgeSelBasedActionCount;
    GtkAction     **selBasedActions;
    guint           selBasedActionCount;
}

/**
 * Constructs the menu and toolbar for @p window
 *
 * @param window  the mainwindow that will be acted upon by the various
 * menu items and toolbar buttons.
 */
- (id) initForMainWindow:(MainWindow*)window;

/**
 * The menubar widget, to be inserted into the main window
 */
- (GtkWidget*) menubar;
/**
 * The toolbar widget, to be inserted into the main window
 */
- (GtkWidget*) toolbar;
/**
 * The main window object passed to initForMainWindow
 */
- (MainWindow*) mainWindow;

/**
 * Enables or disables the undo action
 */
- (void) setUndoActionEnabled:(BOOL)enabled;
/**
 * Sets the text that describes what action will be undone
 *
 * @param detail  a text description of the action, or nil
 */
- (void) setUndoActionDetail:(NSString*)detail;
/**
 * Enables or disables the redo action
 */
- (void) setRedoActionEnabled:(BOOL)enabled;
/**
 * Sets the text that describes what action will be redone
 *
 * @param detail  a text description of the action, or nil
 */
- (void) setRedoActionDetail:(NSString*)detail;

/**
 * Gets the paste action
 */
- (GtkAction*) pasteAction;

/**
 * Enables or disables the actions that act on a selection
 */
- (void) notifySelectionChanged:(PickSupport*)pickSupport;
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
