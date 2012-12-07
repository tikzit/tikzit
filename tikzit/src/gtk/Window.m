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

#import "Window.h"

#import <gtk/gtk.h>
#import "gtkhelpers.h"
#import "clipboard.h"

#import "Application.h"
#import "Configuration.h"
#import "FileChooserDialog.h"
#import "GraphEditorPanel.h"
#import "Menu.h"
#import "RecentManager.h"
#import "Shape.h"
#import "SupportDir.h"
#import "TikzDocument.h"


// {{{ Internal interfaces
// {{{ Clipboard support

static void clipboard_provide_data (GtkClipboard *clipboard,
                                    GtkSelectionData *selection_data,
                                    guint info,
                                    gpointer clipboard_graph_data);
static void clipboard_release_data (GtkClipboard *clipboard, gpointer clipboard_graph_data);
static void clipboard_check_targets (GtkClipboard *clipboard,
                                     GdkAtom *atoms,
                                     gint n_atoms,
                                     gpointer action);
static void clipboard_paste_contents (GtkClipboard *clipboard,
                                      GtkSelectionData *selection_data,
                                      gpointer document);

// }}}
// {{{ Signals

static void window_toplevel_focus_changed_cb (GObject *gobject, GParamSpec *pspec, Window *window);
static void graph_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, Window *window);
static void tikz_buffer_changed_cb (GtkTextBuffer *buffer, Window *window);
static gboolean main_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, Window *window);
static void main_window_destroy_cb (GtkWidget *widget, Window *window);
static gboolean main_window_configure_event_cb (GtkWidget *widget, GdkEventConfigure *event, Window *window);
static void update_paste_action (GtkClipboard *clipboard, GdkEvent *event, GtkAction *action);

// }}}

@interface Window (Notifications)
- (void) tikzBufferChanged;
- (void) windowSizeChangedWidth:(int)width height:(int)height;
- (void) documentTikzChanged:(NSNotification*)notification;
- (void) documentSelectionChanged:(NSNotification*)notification;
- (void) undoStackChanged:(NSNotification*)notification;
@end

@interface Window (InitHelpers)
- (void) _loadUi;
- (void) _restoreUiState;
- (void) _connectSignals;
@end

@interface Window (Private)
- (BOOL) _askCanClose;
/** Open a document, dealing with errors as necessary */
- (TikzDocument*) _openDocument:(NSString*)path;
- (void) _placeGraphOnClipboard:(Graph*)graph;
- (void) _setHasParseError:(BOOL)hasError;
/** Update the window title. */
- (void) _updateTitle;
/** Update the window status bar default text. */
- (void) _updateStatus;
/** Update the displayed tikz code to match the active document. */
- (void) _updateTikz;
/** Update the undo and redo actions to match the active document's
 *  undo stack. */
- (void) _updateUndoActions;
@end

// }}}
// {{{ API

@implementation Window

- (id) init {
    return [self initWithDocument:[TikzDocument documentWithStyleManager:[app styleManager]]];
}
+ (id) window {
    return [[[self alloc] init] autorelease];
}
- (id) initWithDocument:(TikzDocument*)doc {
    self = [super init];

    if (self) {
        [self _loadUi];
        [self _restoreUiState];
        [self _connectSignals];

        [self setDocument:doc];

        gtk_widget_show (GTK_WIDGET (window));
    }

    return self;
}
+ (id) windowWithDocument:(TikzDocument*)doc {
    return [[[self alloc] initWithDocument:doc] autorelease];
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [menu release];
    [graphPanel release];
    [document release];

    g_object_unref (tikzBuffer);
    g_object_unref (tikzPane);
    g_object_unref (tikzPaneSplitter);
    g_object_unref (statusBar);
    g_object_unref (window);

    [super dealloc];
}

- (TikzDocument*) document {
    return document;
}
- (void) setDocument:(TikzDocument*)newDoc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:[document pickSupport]];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:document];

    [newDoc retain];
    [document release];
    document = newDoc;

    [graphPanel setDocument:document];
    [self _updateTikz];
    [self _updateTitle];
    [self _updateStatus];
    [self _updateUndoActions];
    [menu notifySelectionChanged:[document pickSupport]];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(documentTikzChanged:)
                                          name:@"TikzChanged" object:document];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(undoStackChanged:)
                                          name:@"UndoStackChanged" object:document];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(documentSelectionChanged:)
                                          name:@"NodeSelectionChanged" object:[document pickSupport]];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(documentSelectionChanged:)
                                          name:@"EdgeSelectionChanged" object:[document pickSupport]];

    if ([document path] != nil) {
        [[RecentManager defaultManager] addRecentFile:[document path]];
    }
}

- (void) present {
    gtk_window_present (GTK_WINDOW (window));
}

- (void) openFile {
    FileChooserDialog *dialog = [FileChooserDialog openDialogWithParent:window];
    [dialog addStandardFilters];
    if ([document path]) {
        [dialog setCurrentFolder:[document path]];
    } else if ([app lastOpenFolder]) {
        [dialog setCurrentFolder:[app lastOpenFolder]];
    }

    if ([dialog showDialog]) {
        if ([self openFileAtPath:[dialog filePath]]) {
            [app setLastOpenFolder:[dialog currentFolder]];
        }
    }
    [dialog destroy];
}

- (BOOL) openFileAtPath:(NSString*)path {
    TikzDocument *doc = [self _openDocument:path];
    if (doc != nil) {
        if (![document hasUnsavedChanges] && [document path] == nil) {
            // we just have a fresh, untitled document - replace it
            [self setDocument:doc];
        } else {
            [app newWindowWithDocument:doc];
        }
        return YES;
    }
    return NO;
}

- (BOOL) saveActiveDocument {
    if ([document path] == nil) {
        return [self saveActiveDocumentAs];
    } else {
        NSError *error = nil;
        if (![document save:&error]) {
            [self presentError:error];
            return NO;
        } else {
            [self _updateTitle];
            return YES;
        }
    }
}

- (BOOL) saveActiveDocumentAs {
    FileChooserDialog *dialog = [FileChooserDialog saveDialogWithParent:window];
    [dialog addStandardFilters];
    if ([document path] != nil) {
        [dialog setCurrentFolder:[[document path] stringByDeletingLastPathComponent]];
    } else if ([app lastSaveAsFolder] != nil) {
        [dialog setCurrentFolder:[app lastSaveAsFolder]];
    }
    [dialog setSuggestedName:[document suggestedFileName]];

    BOOL saved = NO;
    if ([dialog showDialog]) {
        NSString *nfile = [dialog filePath];

        NSError *error = nil;
        if (![document saveToPath:nfile error:&error]) {
            [self presentError:error];
        } else {
            [self _updateTitle];
            [[RecentManager defaultManager] addRecentFile:nfile];
            [app setLastSaveAsFolder:[dialog currentFolder]];
            saved = YES;
        }
    }
    [dialog destroy];
    return saved;
}

- (void) saveActiveDocumentAsShape {
    GtkWidget *dialog = gtk_dialog_new_with_buttons (
            "Save as shape",
            window,
            GTK_DIALOG_MODAL,
            GTK_STOCK_OK,
            GTK_RESPONSE_ACCEPT,
            GTK_STOCK_CANCEL,
            GTK_RESPONSE_REJECT,
            NULL);
    GtkBox *content = GTK_BOX (gtk_dialog_get_content_area (GTK_DIALOG (dialog)));
    GtkWidget *label1 = gtk_label_new ("Please choose a name for the shape");
    GtkWidget *label2 = gtk_label_new ("Name:");
    GtkWidget *input = gtk_entry_new ();
    GtkBox *hbox = GTK_BOX (gtk_hbox_new (FALSE, 5));
    gtk_box_pack_start (hbox, label2, FALSE, TRUE, 0);
    gtk_box_pack_start (hbox, input, TRUE, TRUE, 0);
    gtk_box_pack_start (content, label1, TRUE, TRUE, 5);
    gtk_box_pack_start (content, GTK_WIDGET (hbox), TRUE, TRUE, 5);
    gtk_widget_show_all (GTK_WIDGET (content));
    gint response = gtk_dialog_run (GTK_DIALOG (dialog));
    while (response == GTK_RESPONSE_ACCEPT) {
        response = GTK_RESPONSE_NONE;
        NSDictionary *shapeDict = [Shape shapeDictionary];
        const gchar *dialogInput = gtk_entry_get_text (GTK_ENTRY (input));
        NSString *shapeName = [NSString stringWithUTF8String:dialogInput];
        BOOL doSave = NO;
        if ([shapeName isEqual:@""]) {
            GtkWidget *emptyStrDialog = gtk_message_dialog_new (window,
                                 GTK_DIALOG_DESTROY_WITH_PARENT,
                                 GTK_MESSAGE_ERROR,
                                 GTK_BUTTONS_CLOSE,
                                 "You must specify a shape name");
            gtk_dialog_run (GTK_DIALOG (emptyStrDialog));
            gtk_widget_destroy (emptyStrDialog);
            response = gtk_dialog_run (GTK_DIALOG (dialog));
        } else if ([shapeDict objectForKey:shapeName] != nil) {
            GtkWidget *overwriteDialog = gtk_message_dialog_new (window,
                                 GTK_DIALOG_DESTROY_WITH_PARENT,
                                 GTK_MESSAGE_QUESTION,
                                 GTK_BUTTONS_YES_NO,
                                 "Do you want to replace the existing shape named '%s'?",
                                 dialogInput);
            gint overwriteResp = gtk_dialog_run (GTK_DIALOG (overwriteDialog));
            gtk_widget_destroy (overwriteDialog);

            if (overwriteResp == GTK_RESPONSE_YES) {
                doSave = YES;
            } else {
                response = gtk_dialog_run (GTK_DIALOG (dialog));
            }
        } else {
            doSave = YES;
        }
        if (doSave) {
            NSError *error = nil;
            NSString *userShapeDir = [[SupportDir userSupportDir] stringByAppendingPathComponent:@"shapes"];
            NSString *file = [NSString stringWithFormat:@"%@/%@.tikz", userShapeDir, shapeName];
            if (![[NSFileManager defaultManager] ensureDirectoryExists:userShapeDir error:&error]) {
                [self presentError:error withMessage:@"Could not create user shape directory"];
            } else {
                NSLog (@"Saving shape to %@", file);
                if (![document saveCopyToPath:file error:&error]) {
                    [self presentError:error withMessage:@"Could not save shape file"];
                } else {
                    [Shape refreshShapeDictionary];
                }
            }
        }
    }
    gtk_widget_destroy (dialog);
}

- (void) close {
    if ([self _askCanClose]) {
        gtk_widget_destroy (GTK_WIDGET (window));
    }
}

- (void) cut {
    if ([[[document pickSupport] selectedNodes] count] > 0) {
        [self _placeGraphOnClipboard:[document cutSelection]];
    }
}

- (void) copy {
    if ([[[document pickSupport] selectedNodes] count] > 0) {
        [self _placeGraphOnClipboard:[document copySelection]];
    }
}

- (void) paste {
    gtk_clipboard_request_contents (gtk_clipboard_get (GDK_SELECTION_CLIPBOARD),
                                    tikzit_picture_atom,
                                    clipboard_paste_contents,
                                    document);
}

- (GtkWindow*) gtkWindow {
    return window;
}

- (Configuration*) mainConfiguration {
    return [app mainConfiguration];
}

- (Menu*) menu {
    return menu;
}

- (void) presentError:(NSError*)error {
    GtkWidget *dialog = gtk_message_dialog_new (window,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s",
                                                [[error localizedDescription] UTF8String]);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) presentError:(NSError*)error withMessage:(NSString*)message {
    GtkWidget *dialog = gtk_message_dialog_new (window,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s: %s",
                                                [message UTF8String],
                                                [[error localizedDescription] UTF8String]);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) presentGError:(GError*)error {
    GtkWidget *dialog = gtk_message_dialog_new (window,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s",
                                                error->message);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) presentGError:(GError*)error withMessage:(NSString*)message {
    GtkWidget *dialog = gtk_message_dialog_new (window,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s: %s",
                                                [message UTF8String],
                                                error->message);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) setActiveTool:(id<Tool>)tool {
    [graphPanel setActiveTool:tool];
    gboolean hasfocus;
    g_object_get (G_OBJECT (window), "has-toplevel-focus", &hasfocus, NULL);
    if (hasfocus) {
        [graphPanel grabTool];
    }
}

- (void) zoomIn {
    [graphPanel zoomIn];
}

- (void) zoomOut {
    [graphPanel zoomOut];
}

- (void) zoomReset {
    [graphPanel zoomReset];
}

@end

// }}}
// {{{ Notifications

@implementation Window (Notifications)
- (void) graphHeightChanged:(int)newHeight {
    [[app mainConfiguration] setIntegerEntry:@"graphHeight"
                                     inGroup:@"window"
                                       value:newHeight];
}

- (void) tikzBufferChanged {
    if (!suppressTikzUpdates) {
        suppressTikzUpdates = TRUE;

        GtkTextIter start, end;
        gtk_text_buffer_get_bounds (tikzBuffer, &start, &end);
        gchar *text = gtk_text_buffer_get_text (tikzBuffer, &start, &end, FALSE);

        BOOL success = [document updateTikz:[NSString stringWithUTF8String:text] error:NULL];
        [self _setHasParseError:!success];

        g_free (text);

        suppressTikzUpdates = FALSE;
    }
}

- (void) windowSizeChangedWidth:(int)width height:(int)height {
    if (width > 0 && height > 0) {
        NSNumber *w = [NSNumber numberWithInt:width];
        NSNumber *h = [NSNumber numberWithInt:height];
        NSMutableArray *size = [NSMutableArray arrayWithCapacity:2];
        [size addObject:w];
        [size addObject:h];
        [[app mainConfiguration] setIntegerListEntry:@"windowSize"
                                             inGroup:@"window"
                                               value:size];
    }
}

- (void) documentTikzChanged:(NSNotification*)notification {
    [self _updateTitle];
    [self _updateTikz];
}

- (void) documentSelectionChanged:(NSNotification*)notification {
    [self _updateStatus];
    [menu notifySelectionChanged:[document pickSupport]];
}

- (void) undoStackChanged:(NSNotification*)notification {
    [self _updateUndoActions];
}
@end

// }}}
// {{{ InitHelpers

@implementation Window (InitHelpers)

- (void) _loadUi {
    window = GTK_WINDOW (gtk_window_new (GTK_WINDOW_TOPLEVEL));
    g_object_ref_sink (window);
    gtk_window_set_title (window, "TikZiT");
    gtk_window_set_default_size (window, 700, 400);

    GtkBox *mainLayout = GTK_BOX (gtk_vbox_new (FALSE, 0));
    gtk_widget_show (GTK_WIDGET (mainLayout));
    gtk_container_add (GTK_CONTAINER (window), GTK_WIDGET (mainLayout));

    menu = [[Menu alloc] initForWindow:self];

    GtkWidget *menubar = [menu menubar];
    gtk_box_pack_start (mainLayout, menubar, FALSE, TRUE, 0);
    gtk_box_reorder_child (mainLayout, menubar, 0);
    gtk_widget_show (menubar);

    tikzPaneSplitter = GTK_PANED (gtk_vpaned_new ());
    g_object_ref_sink (tikzPaneSplitter);
    gtk_widget_show (GTK_WIDGET (tikzPaneSplitter));
    gtk_box_pack_start (mainLayout, GTK_WIDGET (tikzPaneSplitter), TRUE, TRUE, 0);

    graphPanel = [[GraphEditorPanel alloc] initWithDocument:document];
    GtkWidget *graphEditorWidget = [graphPanel widget];
    gtk_widget_show (graphEditorWidget);
    GtkWidget *graphFrame = gtk_frame_new (NULL);
    gtk_container_add (GTK_CONTAINER (graphFrame), graphEditorWidget);
    gtk_widget_show (graphFrame);
    gtk_paned_pack1 (tikzPaneSplitter, graphFrame, TRUE, TRUE);

    tikzBuffer = gtk_text_buffer_new (NULL);
    g_object_ref_sink (tikzBuffer);
    GtkWidget *tikzScroller = gtk_scrolled_window_new (NULL, NULL);
    gtk_widget_show (tikzScroller);

    tikzPane = gtk_text_view_new_with_buffer (tikzBuffer);
    gtk_text_view_set_left_margin (GTK_TEXT_VIEW (tikzPane), 3);
    gtk_text_view_set_right_margin (GTK_TEXT_VIEW (tikzPane), 3);
    g_object_ref_sink (tikzPane);
    gtk_widget_show (tikzPane);
    gtk_container_add (GTK_CONTAINER (tikzScroller), tikzPane);
    GtkWidget *tikzFrame = gtk_frame_new (NULL);
    gtk_container_add (GTK_CONTAINER (tikzFrame), tikzScroller);
    gtk_widget_show (tikzFrame);
    gtk_paned_pack2 (tikzPaneSplitter, tikzFrame, FALSE, TRUE);

    statusBar = GTK_STATUSBAR (gtk_statusbar_new ());
    g_object_ref_sink (statusBar);
    gtk_widget_show (GTK_WIDGET (statusBar));
    gtk_box_pack_start (mainLayout, GTK_WIDGET (statusBar), FALSE, TRUE, 0);

    GtkClipboard *clipboard = gtk_clipboard_get (GDK_SELECTION_CLIPBOARD);
    update_paste_action (clipboard, NULL, [menu pasteAction]);
}

- (void) _restoreUiState {
    Configuration *config = [app mainConfiguration];
    NSArray *windowSize = [config integerListEntry:@"windowSize"
                                           inGroup:@"window"];
    if (windowSize && [windowSize count] == 2) {
        gint width = [[windowSize objectAtIndex:0] intValue];
        gint height = [[windowSize objectAtIndex:1] intValue];
        if (width > 0 && height > 0) {
            gtk_window_set_default_size (window, width, height);
        }
    }
    int panePos = [config integerEntry:@"graphHeight"
                               inGroup:@"window"];
    if (panePos > 0) {
        gtk_paned_set_position (tikzPaneSplitter, panePos);
    }
}

- (void) _connectSignals {
    GtkClipboard *clipboard = gtk_clipboard_get (GDK_SELECTION_CLIPBOARD);
    g_signal_connect (G_OBJECT (clipboard),
        "owner-change",
        G_CALLBACK (update_paste_action),
        [menu pasteAction]);
    g_signal_connect (G_OBJECT (window),
        "key-press-event",
        G_CALLBACK (tz_hijack_key_press),
        NULL);
    g_signal_connect (G_OBJECT (window),
        "notify::has-toplevel-focus",
        G_CALLBACK (window_toplevel_focus_changed_cb),
        self);
    g_signal_connect (G_OBJECT (tikzPaneSplitter),
        "notify::position",
        G_CALLBACK (graph_divider_position_changed_cb),
        self);
    g_signal_connect (G_OBJECT (tikzBuffer),
        "changed",
        G_CALLBACK (tikz_buffer_changed_cb),
        self);
    g_signal_connect (G_OBJECT (window),
        "delete-event",
        G_CALLBACK (main_window_delete_event_cb),
        self);
    g_signal_connect (G_OBJECT (window),
        "destroy",
        G_CALLBACK (main_window_destroy_cb),
        self);
    g_signal_connect (G_OBJECT (window),
        "configure-event",
        G_CALLBACK (main_window_configure_event_cb),
        self);
}
@end

// }}}
// {{{ Private

@implementation Window (Private)

- (BOOL) _askCanClose {
    if ([document hasUnsavedChanges]) {
        GtkWidget *dialog = gtk_message_dialog_new (window,
                GTK_DIALOG_DESTROY_WITH_PARENT,
                GTK_MESSAGE_QUESTION,
                GTK_BUTTONS_NONE,
                "Save changes to the document \"%s\" before closing?",
                [[document name] UTF8String]);
        gtk_dialog_add_buttons (GTK_DIALOG (dialog),
                "Save", GTK_RESPONSE_YES,
                "Don't save", GTK_RESPONSE_NO,
                "Cancel", GTK_RESPONSE_CANCEL,
                NULL);
        gint result = gtk_dialog_run (GTK_DIALOG (dialog));
        gtk_widget_destroy (dialog);
        if (result == GTK_RESPONSE_YES) {
            return [self saveActiveDocument];
        } else {
            return result == GTK_RESPONSE_NO;
        }
    } else {
        return YES;
    }
}

- (TikzDocument*) _openDocument:(NSString*)path {
    NSError *error = nil;
    TikzDocument *d = [TikzDocument documentFromFile:path
                                        styleManager:[app styleManager]
                                               error:&error];
    if (d != nil) {
        return d;
    } else {
        if ([error code] == TZ_ERR_PARSE) {
            [self presentError:error withMessage:@"Invalid file"];
        } else {
            [self presentError:error withMessage:@"Could not open file"];
        }
        [[RecentManager defaultManager] removeRecentFile:path];
        return nil;
    }
}

- (void) _placeGraphOnClipboard:(Graph*)graph {
    GtkClipboard *clipboard = gtk_clipboard_get (GDK_SELECTION_CLIPBOARD);

    static const GtkTargetEntry targets[] = {
          { "TIKZITPICTURE", 0, TARGET_TIKZIT_PICTURE },
          { "UTF8_STRING", 0, TARGET_UTF8_STRING } };

    gtk_clipboard_set_with_data (clipboard,
        targets, G_N_ELEMENTS (targets),
        clipboard_provide_data,
        clipboard_release_data,
        clipboard_graph_data_new (graph));
}

- (void) _setHasParseError:(BOOL)hasError {
    if (hasError && !hasParseError) {
        gtk_statusbar_push (statusBar, 1, "Parse error");
        GdkColor color = {0, 65535, 61184, 61184};
        gtk_widget_modify_base (tikzPane, GTK_STATE_NORMAL, &color);
    } else if (!hasError && hasParseError) {
        gtk_statusbar_pop (statusBar, 1);
        gtk_widget_modify_base (tikzPane, GTK_STATE_NORMAL, NULL);
    }
    hasParseError = hasError;
}

- (void) _updateUndoActions {
    [menu setUndoActionEnabled:[document canUndo]];
    [menu setUndoActionDetail:[document undoName]];

    [menu setRedoActionEnabled:[document canRedo]];
    [menu setRedoActionDetail:[document redoName]];
}

- (void) _updateTitle {
    NSString *title = [NSString stringWithFormat:@"TikZiT - %@%s",
                                              [document name],
                                              ([document hasUnsavedChanges] ? "*" : "")];
    gtk_window_set_title(window, [title UTF8String]);
}

- (void) _updateStatus {
    // FIXME: show tooltips or something instead
    GString *buffer = g_string_sized_new (30);
    gchar *nextNode = 0;

    for (Node *n in [[document pickSupport] selectedNodes]) {
        if (nextNode) {
            if (buffer->len == 0) {
                g_string_printf(buffer, "Nodes %s", nextNode);
            } else {
                g_string_append_printf(buffer, ", %s", nextNode);
            }
        }
        nextNode = (gchar *)[[n name] UTF8String];
    }
    if (nextNode) {
        if (buffer->len == 0) {
            g_string_printf(buffer, "Node %s is selected", nextNode);
        } else {
            g_string_append_printf(buffer, " and %s are selected", nextNode);
        }
    }

    if (buffer->len == 0) {
        int nrNodes = [[[document graph] nodes] count];
        int nrEdges = [[[document graph] edges] count];
        g_string_printf(buffer, "Graph has %d node%s and %d edge%s",
                nrNodes,
                nrNodes!=1 ? "s" : "",
                nrEdges,
                nrEdges!=1 ? "s" : "");
    }
    gtk_statusbar_pop(statusBar, 0);
    gtk_statusbar_push(statusBar, 0, buffer->str);

    g_string_free (buffer, TRUE);
}

- (void) _updateTikz {
    if (document != nil && !suppressTikzUpdates) {
        suppressTikzUpdates = TRUE;

        if (document != nil) {
            const char *tikzString = [[document tikz] UTF8String];
            gtk_text_buffer_set_text (tikzBuffer, tikzString, -1);
        } else {
            gtk_text_buffer_set_text (tikzBuffer, "", -1);
        }
        [self _setHasParseError:NO];

        suppressTikzUpdates = FALSE;
    }
}

- (GraphEditorPanel*) _graphPanel {
    return graphPanel;
}

@end

// }}}
// {{{ GTK+ callbacks

static void window_toplevel_focus_changed_cb (GObject *gobject, GParamSpec *pspec, Window *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    gboolean hasfocus;
    g_object_get (gobject, "has-toplevel-focus", &hasfocus, NULL);
    if (hasfocus) {
        [[NSNotificationCenter defaultCenter]
            postNotificationName:@"WindowGainedFocus"
                          object:window];
        [[window _graphPanel] grabTool];
    } else {
        [[NSNotificationCenter defaultCenter]
            postNotificationName:@"WindowLostFocus"
                          object:window];
    }
    [pool drain];
}

static void graph_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, Window *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    gint position;
    g_object_get (gobject, "position", &position, NULL);
    [window graphHeightChanged:position];
    [pool drain];
}

static void tikz_buffer_changed_cb (GtkTextBuffer *buffer, Window *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window tikzBufferChanged];
    [pool drain];
}

static gboolean main_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, Window *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window close];
    [pool drain];
    return TRUE;
}

static void main_window_destroy_cb (GtkWidget *widget, Window *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"WindowClosed"
                                                        object:window];
    [pool drain];
}

static gboolean main_window_configure_event_cb (GtkWidget *widget, GdkEventConfigure *event, Window *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window windowSizeChangedWidth:event->width height:event->height];
    [pool drain];
    return FALSE;
}

static void clipboard_provide_data (GtkClipboard *clipboard,
                                    GtkSelectionData *selection_data,
                                    guint info,
                                    gpointer clipboard_graph_data) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    ClipboardGraphData *data = (ClipboardGraphData*)clipboard_graph_data;
    if (info == TARGET_UTF8_STRING || info == TARGET_TIKZIT_PICTURE) {
        clipboard_graph_data_convert (data);
        GdkAtom target = (info == TARGET_UTF8_STRING) ? utf8_atom : tikzit_picture_atom;
        gtk_selection_data_set (selection_data,
                target,
                8*sizeof(gchar),
                (guchar*)data->tikz,
                data->tikz_length);
    }

    [pool drain];
}

static void clipboard_release_data (GtkClipboard *clipboard, gpointer data) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    clipboard_graph_data_free ((ClipboardGraphData*)data);
    [pool drain];
}

static void clipboard_check_targets (GtkClipboard *clipboard,
                                     GdkAtom *atoms,
                                     gint n_atoms,
                                     gpointer action) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    gboolean found = FALSE;
    for (gint i = 0; i < n_atoms; ++i) {
        if (atoms[i] == tikzit_picture_atom) {
            found = TRUE;
            break;
        }
    }
    gtk_action_set_sensitive (GTK_ACTION (action), found);

    [pool drain];
}

static void update_paste_action (GtkClipboard *clipboard, GdkEvent *event, GtkAction *action) {
    gtk_action_set_sensitive (action, FALSE);
    gtk_clipboard_request_targets (clipboard, clipboard_check_targets, action);
}

static void clipboard_paste_contents (GtkClipboard *clipboard,
                                      GtkSelectionData *selection_data,
                                      gpointer document) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    TikzDocument *doc = (TikzDocument*)document;
    gint length = gtk_selection_data_get_length (selection_data);
    if (length >= 0) {
        const guchar *raw_data = gtk_selection_data_get_data (selection_data);
        gchar *data = g_new (gchar, length+1);
        g_strlcpy (data, (const gchar *)raw_data, length+1);
        NSString *tikz = [NSString stringWithUTF8String:data];
        if (tikz != nil) {
            [doc pasteFromTikz:tikz];
        }
        g_free (data);
    }

    [pool drain];
}

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
