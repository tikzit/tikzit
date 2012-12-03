/*
 * Copyright 2011-2012  Alex Merry <dev@randomguy3.me.uk>
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

@class GraphRenderer;
@class GraphInputHandler;
@class Menu;
@class PropertyPane;
@class Preambles;
@class PreambleEditor;
@class PreviewWindow;
@class SettingsDialog;
@class StyleManager;
@class StylesPane;
@class TikzDocument;

/**
 * Manages a document window
 */
@interface Window: NSObject {
    // GTK+ widgets
    GtkWindow         *window;
    GtkTextBuffer     *tikzBuffer;
    GtkStatusbar      *statusBar;
    GtkPaned          *tikzPaneSplitter;
    GtkWidget         *tikzPane;

    // Classes that manage parts of the window
    Menu              *menu;
    GraphRenderer     *renderer;
    GraphInputHandler *inputHandler;

    WidgetSurface     *surface;

    // state variables
    BOOL               suppressTikzUpdates;
    BOOL               hasParseError;

    // the document displayed by the window
    TikzDocument      *document;
}

/**
 * The document displayed by the window
 */
@property (retain) TikzDocument *document;

/**
 * Create a window with an empty document
 */
- (id) init;
+ (id) window;

/**
 * Create a window with the given document
 */
- (id) initWithDocument:(TikzDocument*)doc;
+ (id) windowWithDocument:(TikzDocument*)doc;

/**
 * Open a file, asking the user which file to open
 */
- (void) openFile;
/**
 * Open a file
 */
- (BOOL) openFileAtPath:(NSString*)path;
/**
 * Save the active document to the path it was opened from
 * or last saved to, or ask the user where to save it.
 */
- (BOOL) saveActiveDocument;
/**
 * Save the active document, asking the user where to save it.
 */
- (BOOL) saveActiveDocumentAs;
/**
 * Save the active document as a shape, asking the user what to name it.
 */
- (void) saveActiveDocumentAsShape;

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
 * The graph input handler
 */
- (GraphInputHandler*) graphInputHandler;
/**
 * The GTK+ window that this class manages.
 */
- (GtkWindow*) gtkWindow;
/**
 * The menu for the window.
 */
- (Menu*) menu;

/**
 * Present an error to the user
 *
 * @param error  the error to present
 */
- (void) presentError:(NSError*)error;
/**
 * Present an error to the user
 *
 * @param error    the error to present
 * @param message  a message to display with the error
 */
- (void) presentError:(NSError*)error withMessage:(NSString*)message;
/**
 * Present an error to the user
 *
 * @param error  the error to present
 */
- (void) presentGError:(GError*)error;
/**
 * Present an error to the user
 *
 * @param error    the error to present
 * @param message  a message to display with the error
 */
- (void) presentGError:(GError*)error withMessage:(NSString*)message;

- (void) zoomIn;
- (void) zoomOut;
- (void) zoomReset;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
