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

#import "MainWindow.h"

#import <gtk/gtk.h>
#import "gtkhelpers.h"
#import "clipboard.h"

#import "Configuration.h"
#import "FileChooserDialog.h"
#import "GraphInputHandler.h"
#import "GraphRenderer.h"
#import "Menu.h"
#import "PreambleEditor.h"
#import "Preambles.h"
#import "Preambles+Storage.h"
#ifdef HAVE_POPPLER
#import "PreviewWindow.h"
#endif
#import "PropertyPane.h"
#import "RecentManager.h"
#import "StyleManager.h"
#import "Shape.h"
#import "StyleManager+Storage.h"
#import "NodeStylesPalette.h"
#import "SupportDir.h"
#import "TikzDocument.h"
#import "WidgetSurface.h"


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

static void toolbox_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, MainWindow *window);
static void stylebox_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, MainWindow *window);
static void graph_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, MainWindow *window);
static void tikz_buffer_changed_cb (GtkTextBuffer *buffer, MainWindow *window);
static gboolean main_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, MainWindow *window);
static void main_window_destroy_cb (GtkWidget *widget, MainWindow *window);
static gboolean main_window_configure_event_cb (GtkWidget *widget, GdkEventConfigure *event, MainWindow *window);
static void update_paste_action (GtkClipboard *clipboard, GdkEvent *event, GtkAction *action);

// }}}

@interface MainWindow (Notifications)
- (void) toolboxWidthChanged:(int)newWidth;
- (void) styleboxWidthChanged:(int)newWidth;
- (void) tikzBufferChanged;
- (void) windowSizeChangedWidth:(int)width height:(int)height;
- (void) documentTikzChanged:(NSNotification*)notification;
- (void) documentSelectionChanged:(NSNotification*)notification;
- (void) undoStackChanged:(NSNotification*)notification;
@end

@interface MainWindow (InitHelpers)
- (void) _loadConfig;
- (void) _loadStyles;
- (void) _loadPreambles;
- (void) _loadUi;
- (void) _restoreUiState;
- (void) _connectSignals;
@end

@interface MainWindow (Private)
- (BOOL) _confirmCloseDocumentTo:(NSString*)action;
- (void) _forceLoadDocumentFromFile:(NSString*)path;
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
/** Set the last-accessed folder */
- (void) _setLastFolder:(NSString*)path;
/** Set the active document */
- (void) _setActiveDocument:(TikzDocument*)newDoc;
@end

// }}}
// {{{ API

@implementation MainWindow

- (id) init {
    self = [super init];

    if (self) {
        document = nil;
        preambleWindow = nil;
        previewWindow = nil;
        suppressTikzUpdates = NO;
        hasParseError = NO;

        [self _loadConfig];
        [self _loadStyles];
        [self _loadPreambles];
        lastFolder = [[configFile stringEntry:@"lastFolder" inGroup:@"Paths"] retain];
        [self _loadUi];
        [self _restoreUiState];
        [self _connectSignals];

        [self loadEmptyDocument];

        gtk_widget_show (GTK_WIDGET (mainWindow));
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    [configFile release];
    [styleManager release];
    [preambles release];
    [menu release];
    [renderer release];
    [inputHandler release];
    [stylesPalette release];
    [propertyPane release];
    [preambleWindow release];
    [previewWindow release];
    [surface release];
    [lastFolder release];
    [document release];

    g_object_unref (mainWindow);
    g_object_unref (tikzBuffer);
    g_object_unref (statusBar);
    g_object_unref (propsPane);
    g_object_unref (stylesPane);
    g_object_unref (graphPane);
    g_object_unref (tikzDisp);

    [super dealloc];
}

- (void) openFile {
    if (![self _confirmCloseDocumentTo:@"open a new document"]) {
        return;
    }
    FileChooserDialog *dialog = [FileChooserDialog openDialogWithParent:mainWindow];
    [dialog addStandardFilters];
    if (lastFolder) {
        [dialog setCurrentFolder:lastFolder];
    }

    if ([dialog showDialog]) {
        [self _forceLoadDocumentFromFile:[dialog filePath]];
        [self _setLastFolder:[dialog currentFolder]];
    }
    [dialog destroy];
}

- (void) saveActiveDocument {
    if ([document path] == nil) {
        [self saveActiveDocumentAs];
    } else {
        NSError *error = nil;
        if (![document save:&error]) {
            [self presentError:error];
        } else {
            [self _updateTitle];
        }
    }
}

- (void) saveActiveDocumentAs {
    FileChooserDialog *dialog = [FileChooserDialog saveDialogWithParent:mainWindow];
    [dialog addStandardFilters];
    if ([document path] != nil) {
        [dialog setCurrentFolder:[[document path] stringByDeletingLastPathComponent]];
    } else if (lastFolder != nil) {
        [dialog setCurrentFolder:lastFolder];
    }
    [dialog setSuggestedName:[document suggestedFileName]];

    if ([dialog showDialog]) {
        NSString *nfile = [dialog filePath];

        NSError *error = nil;
        if (![document saveToPath:nfile error:&error]) {
            [self presentError:error];
        } else {
            [self _updateTitle];
            [[RecentManager defaultManager] addRecentFile:nfile];
            [self _setLastFolder:[dialog currentFolder]];
        }
    }
    [dialog destroy];
}

- (void) saveActiveDocumentAsShape {
    GtkWidget *dialog = gtk_dialog_new_with_buttons (
            "Save as shape",
            mainWindow,
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
            GtkWidget *emptyStrDialog = gtk_message_dialog_new (mainWindow,
                                 GTK_DIALOG_DESTROY_WITH_PARENT,
                                 GTK_MESSAGE_ERROR,
                                 GTK_BUTTONS_CLOSE,
                                 "You must specify a shape name");
            gtk_dialog_run (GTK_DIALOG (emptyStrDialog));
            gtk_widget_destroy (emptyStrDialog);
            response = gtk_dialog_run (GTK_DIALOG (dialog));
        } else if ([shapeDict objectForKey:shapeName] != nil) {
            GtkWidget *overwriteDialog = gtk_message_dialog_new (mainWindow,
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

- (void) quit {
    if ([self askCanQuit]) {
        gtk_main_quit();
    }
}

- (BOOL) askCanQuit {
    if ([document hasUnsavedChanges]) {
        GtkWidget *dialog = gtk_message_dialog_new (mainWindow,
                                         GTK_DIALOG_DESTROY_WITH_PARENT,
                                         GTK_MESSAGE_QUESTION,
                                         GTK_BUTTONS_YES_NO,
                                         "Are you sure you want to quit without saving the current file?");
        gint result = gtk_dialog_run (GTK_DIALOG (dialog));
        gtk_widget_destroy (dialog);
        return (result == GTK_RESPONSE_YES) ? YES : NO;
    }

    return YES;
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

- (void) editPreambles {
    if (preambleWindow == nil) {
        preambleWindow = [[PreambleEditor alloc] initWithPreambles:preambles];
        [preambleWindow setParentWindow:mainWindow];
    }
    [preambleWindow show];
}

- (void) showPreview {
#ifdef HAVE_POPPLER
    if (previewWindow == nil) {
        previewWindow = [[PreviewWindow alloc] initWithPreambles:preambles];
        [previewWindow setParentWindow:mainWindow];
        [previewWindow setDocument:document];
    }
    [previewWindow show];
#endif
}

- (GraphInputHandler*) graphInputHandler {
    return inputHandler;
}

- (GtkWindow*) gtkWindow {
    return mainWindow;
}

- (Configuration*) mainConfiguration {
    return configFile;
}

- (Menu*) menu {
    return menu;
}

- (TikzDocument*) activeDocument {
    return document;
}

- (void) loadEmptyDocument {
    if (![self _confirmCloseDocumentTo:@"start a new document"]) {
        return;
    }
    [self _setActiveDocument:[TikzDocument documentWithStyleManager:styleManager]];
}

- (void) loadDocumentFromFile:(NSString*)path {
    if (![self _confirmCloseDocumentTo:@"open a new document"]) {
        return;
    }
    [self _forceLoadDocumentFromFile:path];
}

- (void) presentError:(NSError*)error {
    GtkWidget *dialog = gtk_message_dialog_new (mainWindow,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s",
                                                [[error localizedDescription] UTF8String]);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) presentError:(NSError*)error withMessage:(NSString*)message {
    GtkWidget *dialog = gtk_message_dialog_new (mainWindow,
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
    GtkWidget *dialog = gtk_message_dialog_new (mainWindow,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s",
                                                error->message);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) presentGError:(GError*)error withMessage:(NSString*)message {
    GtkWidget *dialog = gtk_message_dialog_new (mainWindow,
                                                GTK_DIALOG_DESTROY_WITH_PARENT,
                                                GTK_MESSAGE_ERROR,
                                                GTK_BUTTONS_CLOSE,
                                                "%s: %s",
                                                [message UTF8String],
                                                error->message);
    gtk_dialog_run (GTK_DIALOG (dialog));
    gtk_widget_destroy (dialog);
}

- (void) saveConfiguration {
    NSError *error = nil;

    if (preambles != nil) {
        NSString *preamblesDir = [[SupportDir userSupportDir] stringByAppendingPathComponent:@"preambles"];
        [[NSFileManager defaultManager] createDirectoryAtPath:preamblesDir withIntermediateDirectories:YES attributes:nil error:NULL];
        [preambles storeToDirectory:preamblesDir];
        [configFile setStringEntry:@"selectedPreamble" inGroup:@"Preambles" value:[preambles selectedPreambleName]];
    }

    [styleManager saveStylesUsingConfigurationName:@"styles"];
    [propertyPane saveUiStateToConfig:configFile group:@"PropertyPane"];

    if (lastFolder != nil) {
        [configFile setStringEntry:@"lastFolder" inGroup:@"Paths" value:lastFolder];
    }

    if (![configFile writeToStoreWithError:&error]) {
        logError (error, @"Could not write config file");
    }
}

- (void) zoomIn {
    [surface zoomIn];
}

- (void) zoomOut {
    [surface zoomOut];
}

- (void) zoomReset {
    [surface zoomReset];
}

@end

// }}}
// {{{ Notifications

@implementation MainWindow (Notifications)
- (void) toolboxWidthChanged:(int)newWidth {
    [configFile setIntegerEntry:@"toolboxWidth" inGroup:@"mainWindow" value:newWidth];
}

- (void) styleboxWidthChanged:(int)newWidth {
    [configFile setIntegerEntry:@"styleboxWidth" inGroup:@"mainWindow" value:newWidth];
}

- (void) graphHeightChanged:(int)newHeight {
    [configFile setIntegerEntry:@"graphHeight" inGroup:@"mainWindow" value:newHeight];
}

- (void) tikzBufferChanged {
    if (!suppressTikzUpdates) {
        suppressTikzUpdates = TRUE;

        GtkTextIter start, end;
        gtk_text_buffer_get_bounds (tikzBuffer, &start, &end);
        gchar *text = gtk_text_buffer_get_text (tikzBuffer, &start, &end, FALSE);

        BOOL success = [document setTikz:[NSString stringWithUTF8String:text]];
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
        [configFile setIntegerListEntry:@"windowSize" inGroup:@"mainWindow" value:size];
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

@implementation MainWindow (InitHelpers)

- (void) _loadConfig {
    NSError *error = nil;
    configFile = [[Configuration alloc] initWithName:@"tikzit" loadError:&error];
    if (error != nil) {
        logError (error, @"WARNING: Failed to load configuration");
    }
}

- (void) _loadStyles {
    styleManager = [[StyleManager alloc] init];
    [styleManager loadStylesUsingConfigurationName:@"styles"];
}

// must happen after _loadStyles
- (void) _loadPreambles {
    NSString *preamblesDir = [[SupportDir userSupportDir] stringByAppendingPathComponent:@"preambles"];
    preambles = [[Preambles alloc] initFromDirectory:preamblesDir];
    [preambles setStyleManager:styleManager];
    NSString *selectedPreamble = [configFile stringEntry:@"selectedPreamble" inGroup:@"Preambles"];
    if (selectedPreamble != nil) {
        [preambles setSelectedPreambleName:selectedPreamble];
    }
}

- (void) _loadUi {
    mainWindow = GTK_WINDOW (gtk_window_new (GTK_WINDOW_TOPLEVEL));
    g_object_ref_sink (mainWindow);
    gtk_window_set_title (mainWindow, "TikZiT");
    gtk_window_set_default_size (mainWindow, 700, 400);
    GdkPixbuf *icon = gdk_pixbuf_new_from_file (TIKZITSHAREDIR "/tikzit48x48.png", NULL);
    if (icon) {
        gtk_window_set_icon (mainWindow, icon);
        g_object_unref (icon);
    }

    GtkBox *mainLayout = GTK_BOX (gtk_vbox_new (FALSE, 0));
    gtk_widget_show (GTK_WIDGET (mainLayout));
    gtk_container_add (GTK_CONTAINER (mainWindow), GTK_WIDGET (mainLayout));

    menu = [[Menu alloc] initForMainWindow:self];

    GtkWidget *menubar = [menu menubar];
    gtk_box_pack_start (mainLayout, menubar, FALSE, TRUE, 0);
    gtk_box_reorder_child (mainLayout, menubar, 0);
    gtk_widget_show (menubar);

    GtkWidget *toolbarBox = gtk_handle_box_new ();
    gtk_box_pack_start (mainLayout, toolbarBox, FALSE, TRUE, 0);
    gtk_widget_show (toolbarBox);
    gtk_container_add (GTK_CONTAINER (toolbarBox), [menu toolbar]);
    gtk_widget_show ([menu toolbar]);

    propsPane = GTK_PANED (gtk_hpaned_new ());
    g_object_ref_sink (propsPane);
    gtk_widget_show (GTK_WIDGET (propsPane));
    gtk_box_pack_start (mainLayout, GTK_WIDGET (propsPane), TRUE, TRUE, 0);

    propertyPane = [[PropertyPane alloc] init];
    gtk_paned_pack1 (propsPane, [propertyPane widget], FALSE, TRUE);
    gtk_widget_show ([propertyPane widget]);

    stylesPane = GTK_PANED (gtk_hpaned_new ());
    g_object_ref_sink (stylesPane);
    gtk_widget_show (GTK_WIDGET (stylesPane));
    gtk_paned_pack2 (propsPane, GTK_WIDGET (stylesPane), TRUE, TRUE);

    stylesPalette = [[NodeStylesPalette alloc] initWithManager:styleManager];
    gtk_paned_pack2 (stylesPane, [stylesPalette widget], FALSE, TRUE);
    gtk_widget_show ([stylesPalette widget]);

    graphPane = GTK_PANED (gtk_vpaned_new ());
    g_object_ref_sink (graphPane);
    gtk_widget_show (GTK_WIDGET (graphPane));
    gtk_paned_pack1 (stylesPane, GTK_WIDGET (graphPane), TRUE, TRUE);

    surface = [[WidgetSurface alloc] init];
    gtk_widget_show ([surface widget]);
    gtk_paned_pack1 (graphPane, [surface widget], TRUE, TRUE);
    [surface setDefaultScale:50.0f];
    [surface setKeepCentered:YES];
    [surface setGrabsFocusOnClick:YES];
    renderer = [[GraphRenderer alloc] initWithSurface:surface document:document];

    inputHandler = [[GraphInputHandler alloc] initWithGraphRenderer:renderer];
    [surface setInputDelegate:inputHandler];

    tikzBuffer = gtk_text_buffer_new (NULL);
    g_object_ref_sink (tikzBuffer);
    GtkWidget *tikzScroller = gtk_scrolled_window_new (NULL, NULL);
    gtk_widget_show (tikzScroller);

    tikzDisp = gtk_text_view_new_with_buffer (tikzBuffer);
    g_object_ref_sink (tikzDisp);
    gtk_widget_show (tikzDisp);
    gtk_container_add (GTK_CONTAINER (tikzScroller), tikzDisp);
    gtk_paned_pack2 (graphPane, tikzScroller, FALSE, TRUE);

    statusBar = GTK_STATUSBAR (gtk_statusbar_new ());
    gtk_widget_show (GTK_WIDGET (statusBar));
    gtk_box_pack_start (mainLayout, GTK_WIDGET (statusBar), FALSE, TRUE, 0);

    GtkClipboard *clipboard = gtk_clipboard_get (GDK_SELECTION_CLIPBOARD);
    update_paste_action (clipboard, NULL, [menu pasteAction]);
}

- (void) _restoreUiState {
    NSArray *windowSize = [configFile integerListEntry:@"windowSize" inGroup:@"mainWindow"];
    if (windowSize && [windowSize count] == 2) {
        gint width = [[windowSize objectAtIndex:0] intValue];
        gint height = [[windowSize objectAtIndex:1] intValue];
        if (width > 0 && height > 0) {
            gtk_window_set_default_size (mainWindow, width, height);
        }
    }
    int panePos = [configFile integerEntry:@"toolboxWidth" inGroup:@"mainWindow"];
    if (panePos > 0) {
        gtk_paned_set_position (propsPane, panePos);
    }
    panePos = [configFile integerEntry:@"styleboxWidth" inGroup:@"mainWindow"];
    if (panePos > 0) {
        gtk_paned_set_position (stylesPane, panePos);
    }
    panePos = [configFile integerEntry:@"graphHeight" inGroup:@"mainWindow"];
    if (panePos > 0) {
        gtk_paned_set_position (graphPane, panePos);
    }
    [propertyPane restoreUiStateFromConfig:configFile group:@"PropertyPane"];
}

- (void) _connectSignals {
    GtkClipboard *clipboard = gtk_clipboard_get (GDK_SELECTION_CLIPBOARD);
    g_signal_connect (G_OBJECT (clipboard),
        "owner-change",
        G_CALLBACK (update_paste_action),
        [menu pasteAction]);
    g_signal_connect (G_OBJECT (mainWindow),
        "key-press-event",
        G_CALLBACK (tz_hijack_key_press),
        NULL);
    g_signal_connect (G_OBJECT (propsPane),
        "notify::position",
        G_CALLBACK (toolbox_divider_position_changed_cb),
        self);
    g_signal_connect (G_OBJECT (stylesPane),
        "notify::position",
        G_CALLBACK (stylebox_divider_position_changed_cb),
        self);
    g_signal_connect (G_OBJECT (graphPane),
        "notify::position",
        G_CALLBACK (graph_divider_position_changed_cb),
        self);
    g_signal_connect (G_OBJECT (tikzBuffer),
        "changed",
        G_CALLBACK (tikz_buffer_changed_cb),
        self);
    g_signal_connect (G_OBJECT (mainWindow),
        "delete-event",
        G_CALLBACK (main_window_delete_event_cb),
        self);
    g_signal_connect (G_OBJECT (mainWindow),
        "destroy",
        G_CALLBACK (main_window_destroy_cb),
        self);
    g_signal_connect (G_OBJECT (mainWindow),
        "configure-event",
        G_CALLBACK (main_window_configure_event_cb),
        self);
}
@end

// }}}
// {{{ Private

@implementation MainWindow (Private)

- (BOOL) _confirmCloseDocumentTo:(NSString*)action {
    BOOL proceed = YES;
    if ([document hasUnsavedChanges]) {
        NSString *message = [NSString stringWithFormat:@"You have unsaved changes to the current document, which will be lost if you %@. Are you sure you want to continue?", action];
        GtkWidget *dialog = gtk_message_dialog_new (NULL,
                GTK_DIALOG_DESTROY_WITH_PARENT,
                GTK_MESSAGE_QUESTION,
                GTK_BUTTONS_YES_NO, 
                [message UTF8String]); 
        gtk_window_set_title(GTK_WINDOW(dialog), "Close current document?"); 
        proceed = gtk_dialog_run (GTK_DIALOG (dialog)) == GTK_RESPONSE_YES;
        gtk_widget_destroy (dialog);    
    }
    return proceed;
}

- (void) _forceLoadDocumentFromFile:(NSString*)path {
    NSError *error = nil;
    TikzDocument *d = [TikzDocument documentFromFile:path styleManager:styleManager error:&error];
    if (d != nil) {
        [self _setActiveDocument:d];
        [[RecentManager defaultManager] addRecentFile:path];
    } else {
        [self presentError:error withMessage:@"Could not open file"];
        [[RecentManager defaultManager] removeRecentFile:path];
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
        gtk_widget_modify_base (tikzDisp, GTK_STATE_NORMAL, &color);
    } else if (!hasError && hasParseError) {
        gtk_statusbar_pop (statusBar, 1);
        gtk_widget_modify_base (tikzDisp, GTK_STATE_NORMAL, NULL);
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
    gtk_window_set_title(mainWindow, [title UTF8String]);
}

- (void) _updateStatus {
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

- (void) _setLastFolder:(NSString*)path {
    [path retain];
    [lastFolder release];
    lastFolder = path;
}

- (void) _setActiveDocument:(TikzDocument*)newDoc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:[document pickSupport]];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:nil object:document];

    [newDoc retain];
    [document release];
    document = newDoc;

    [renderer setDocument:document];
    [stylesPalette setDocument:document];
    [propertyPane setDocument:document];
#ifdef HAVE_POPPLER
    [previewWindow setDocument:document];
#endif
    [self _updateTikz];
    [self _updateTitle];
    [self _updateStatus];
    [self _updateUndoActions];
    [menu notifySelectionChanged:[document pickSupport]];
    [inputHandler resetState];
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
}

@end

// }}}
// {{{ GTK+ callbacks

static void toolbox_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    gint position;
    g_object_get (gobject, "position", &position, NULL);
    [window toolboxWidthChanged:position];
    [pool drain];
}

static void stylebox_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    gint position;
    g_object_get (gobject, "position", &position, NULL);
    [window styleboxWidthChanged:position];
    [pool drain];
}

static void graph_divider_position_changed_cb (GObject *gobject, GParamSpec *pspec, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    gint position;
    g_object_get (gobject, "position", &position, NULL);
    [window graphHeightChanged:position];
    [pool drain];
}

static void tikz_buffer_changed_cb (GtkTextBuffer *buffer, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window tikzBufferChanged];
    [pool drain];
}

static gboolean main_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    return ![window askCanQuit];
    [pool drain];
}

static void main_window_destroy_cb (GtkWidget *widget, MainWindow *window) {
    gtk_main_quit();
}

static gboolean main_window_configure_event_cb (GtkWidget *widget, GdkEventConfigure *event, MainWindow *window) {
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
