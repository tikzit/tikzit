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

#import "TZFoundation.h"
#import <gtk/gtk.h>
#import "WidgetSurface.h"

@class Configuration;
@class GraphRenderer;
@class GraphInputHandler;
@class Menu;
@class PropertyPane;
@class Preambles;
@class PreambleEditor;
@class PreviewWindow;
@class StyleManager;
@class StylesPane;
@class TikzDocument;

/**
 * Manages the main application window
 */
@interface MainWindow: NSObject {
    // the main application configuration
    Configuration *configFile;
    // maintains the known (user-defined) styles
    StyleManager      *styleManager;
    // maintains the preambles used for previews
    Preambles         *preambles;

    // GTK+ widgets
    GtkWindow         *mainWindow;
    GtkTextBuffer     *tikzBuffer;
    GtkStatusbar      *statusBar;
    GtkPaned          *propertyPaneSplitter;
    GtkPaned          *stylesPaneSplitter;
    GtkPaned          *tikzPaneSplitter;
    GtkWidget         *tikzPane;

    // Classes that manage parts of the window
    // (or other windows)
    Menu              *menu;
    GraphRenderer     *renderer;
    GraphInputHandler *inputHandler;
    StylesPane        *stylesPane;
    PropertyPane      *propertyPane;
    PreambleEditor    *preambleWindow;
    PreviewWindow     *previewWindow;

    WidgetSurface     *surface;

    // state variables
    BOOL               suppressTikzUpdates;
    BOOL               hasParseError;
    // the last-accessed folder (for open and save dialogs)
    NSString          *lastFolder;
    // the open (active) document
    TikzDocument      *document;
}

/**
 * Create and show the main window.
 */
- (id) init;

/**
 * Open a file, asking the user which file to open
 */
- (void) openFile;
/**
 * Save the active document to the path it was opened from
 * or last saved to, or ask the user where to save it.
 */
- (void) saveActiveDocument;
/**
 * Save the active document, asking the user where to save it.
 */
- (void) saveActiveDocumentAs;
/**
 * Save the active document as a shape, asking the user what to name it.
 */
- (void) saveActiveDocumentAsShape;
/**
 * Quit the application, confirming with the user if there are
 * changes to an open document.
 */
- (void) quit;
/**
 * If there are changes to an open document, ask the user if they
 * want to quit the application, discarding those changes.
 *
 * @result  YES if there are no unsaved changes or the user is happy
 *          to discard any unsaved changes, NO if the application
 *          should not quit.
 */
- (BOOL) askCanQuit;

/**
 * Cut the current selection to the clipboard.
 */
- (void) cut;
/**
 * Copy the current selection to the clipboard.
 */
- (void) copy;
/**
 * Paste from the clipboard to the appropriate place.
 */
- (void) paste;

/**
 * Show the dialog for editing preambles.
 */
- (void) editPreambles;
/**
 * Show or update the preview window.
 */
- (void) showPreview;

/**
 * The graph input handler
 */
- (GraphInputHandler*) graphInputHandler;
/**
 * The GTK+ window that this class manages.
 */
- (GtkWindow*) gtkWindow;
/**
 * The main application configuration file
 */
- (Configuration*) mainConfiguration;
/**
 * The menu for the window.
 */
- (Menu*) menu;

/**
 * The document the user is currently editing
 */
- (TikzDocument*) activeDocument;

/**
 * Loads a new, empty document as the active document
 */
- (void) loadEmptyDocument;
/**
 * Loads an existing document from a file as the active document
 *
 * @param path  the path to the tikz file containing the document
 */
- (void) loadDocumentFromFile:(NSString*)path;

/**
 * Present an error to the user
 *
 * (currently just outputs it on the command line)
 *
 * @param error  the error to present
 */
- (void) presentError:(NSError*)error;
/**
 * Present an error to the user
 *
 * (currently just outputs it on the command line)
 *
 * @param error    the error to present
 * @param message  a message to display with the error
 */
- (void) presentError:(NSError*)error withMessage:(NSString*)message;
/**
 * Present an error to the user
 *
 * (currently just outputs it on the command line)
 *
 * @param error  the error to present
 */
- (void) presentGError:(GError*)error;
/**
 * Present an error to the user
 *
 * (currently just outputs it on the command line)
 *
 * @param error    the error to present
 * @param message  a message to display with the error
 */
- (void) presentGError:(GError*)error withMessage:(NSString*)message;

/**
 * Save the application configuration to disk
 *
 * Should be called just before the application exits
 */
- (void) saveConfiguration;

- (void) zoomIn;
- (void) zoomOut;
- (void) zoomReset;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
