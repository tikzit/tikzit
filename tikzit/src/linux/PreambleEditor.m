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

#import "PreambleEditor.h"
#import "Preambles.h"
#import <gdk/gdk.h>

enum {
	NAME_COLUMN,
	IS_CUSTOM_COLUMN,
	N_COLUMNS
};

// {{{ Internal interfaces
// {{{ Signals
static gboolean window_delete_event_cb (GtkWidget *widget,
                                        GdkEvent  *event,
                                        PreambleEditor *editor);
static gboolean window_focus_out_event_cb (GtkWidget *widget,
                                           GdkEvent  *event,
                                           PreambleEditor *editor);
static void close_button_clicked_cb (GtkButton *widget, PreambleEditor *editor);
static void add_button_clicked_cb (GtkButton *widget, PreambleEditor *editor);
static void remove_button_clicked_cb (GtkButton *widget, PreambleEditor *editor);
static void undo_button_clicked_cb (GtkButton *widget, PreambleEditor *editor);
static void redo_button_clicked_cb (GtkButton *widget, PreambleEditor *editor);
static void preamble_name_edited_cb (GtkCellRendererText *renderer,
                                     gchar               *path,
                                     gchar               *new_text,
                                     PreambleEditor      *editor);
static void preamble_selection_changed_cb (GtkTreeSelection *treeselection,
                                           PreambleEditor   *editor);
// }}}

@interface PreambleEditor (Private)
- (void) loadUi;
- (void) save;
- (void) revert;
- (void) update;
- (void) fillListStore;
- (BOOL) isDefaultPreambleSelected;
- (NSString*) selectedPreambleName;
- (void) addPreamble;
- (void) deletePreamble;
- (void) renamePreambleAtPath:(gchar*)path to:(gchar*)newValue;
- (void) nodeStylePropertyChanged:(NSNotification*)notification;
- (void) edgeStylePropertyChanged:(NSNotification*)notification;
@end

// }}}
// {{{ API

@implementation PreambleEditor

- (id) init {
	[self release];
	self = nil;
	return nil;
}

- (id) initWithPreambles:(Preambles*)p {
	self = [super init];

	if (self) {
	    preambles = [p retain];
	    parentWindow = NULL;
	    window = NULL;
	    preambleView = NULL;
	    preambleSelector = NULL;
	    blockSignals = NO;
		adding = NO;
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(nodeStylePropertyChanged:)
                                                     name:@"NodeStylePropertyChanged"
                                                   object:nil];
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(edgeStylePropertyChanged:)
                                                     name:@"EdgeStylePropertyChanged"
                                                   object:nil];
	}

	return self;
}

- (Preambles*) preambles {
	return preambles;
}

- (void) setParentWindow:(GtkWindow*)parent {
	parentWindow = parent;
	if (window) {
	    gtk_window_set_transient_for (window, parentWindow);
	}
}

- (void) show {
	[self loadUi];
	gtk_widget_show (GTK_WIDGET (window));
	[self revert];
}

- (void) hide {
	if (!window) {
	    return;
	}
	[self save];
	gtk_widget_hide (GTK_WIDGET (window));
}

- (BOOL) isVisible {
	if (!window) {
	    return NO;
	}
	gboolean visible;
	g_object_get (G_OBJECT (window), "visible", &visible, NULL);
	return visible ? YES : NO;
}

- (void) setVisible:(BOOL)visible {
	if (visible) {
	    [self show];
	} else {
	    [self hide];
	}
}

- (void) dealloc {
	[preambles release];
	preambles = nil;
	gtk_widget_destroy (GTK_WIDGET (window));
	window = NULL;

	[super dealloc];
}

@end

// }}}
// {{{ Private

@implementation PreambleEditor (Private)
- (GtkWidget*) createPreambleList {
	preambleListStore = gtk_list_store_new (N_COLUMNS, G_TYPE_STRING, G_TYPE_BOOLEAN);
	preambleSelector = GTK_TREE_VIEW (gtk_tree_view_new_with_model (
	            GTK_TREE_MODEL (preambleListStore)));
	gtk_widget_set_size_request (GTK_WIDGET (preambleSelector), 150, -1);
	gtk_tree_view_set_headers_visible (preambleSelector, FALSE);

	GtkCellRenderer *renderer;
	GtkTreeViewColumn *column;

	renderer = gtk_cell_renderer_text_new ();
	column = gtk_tree_view_column_new_with_attributes ("Preamble",
	                                                   renderer,
	                                                   "text", NAME_COLUMN,
	                                                   "editable", IS_CUSTOM_COLUMN,
	                                                   NULL);
	gtk_tree_view_append_column (preambleSelector, column);
	g_signal_connect (G_OBJECT (renderer),
	    "edited",
	    G_CALLBACK (preamble_name_edited_cb),
	    self);

	GtkWidget *listScroller = gtk_scrolled_window_new (NULL, NULL);
	gtk_scrolled_window_set_policy (GTK_SCROLLED_WINDOW (listScroller),
	        GTK_POLICY_AUTOMATIC,
	        GTK_POLICY_AUTOMATIC);
	gtk_container_add (GTK_CONTAINER (listScroller),
	                   GTK_WIDGET (preambleSelector));

	[self fillListStore];

	GtkTreeSelection *sel = gtk_tree_view_get_selection (preambleSelector);
	gtk_tree_selection_set_mode (sel, GTK_SELECTION_BROWSE);
	g_signal_connect (G_OBJECT (sel),
	    "changed",
	    G_CALLBACK (preamble_selection_changed_cb),
	    self);

	return listScroller;
}

- (void) loadUi {
	if (window) {
	    return;
	}

	window = GTK_WINDOW (gtk_window_new (GTK_WINDOW_TOPLEVEL));
	gtk_window_set_title (window, "Preamble editor");
	gtk_window_set_position (window, GTK_WIN_POS_CENTER_ON_PARENT);
	gtk_window_set_default_size (window, 600, 400);
	gtk_window_set_type_hint (window, GDK_WINDOW_TYPE_HINT_DIALOG);
	if (parentWindow) {
	    gtk_window_set_transient_for (window, parentWindow);
	}
	GdkEventMask mask;
	g_object_get (G_OBJECT (window), "events", &mask, NULL);
	mask |= GDK_FOCUS_CHANGE_MASK;
	g_object_set (G_OBJECT (window), "events", mask, NULL);
	g_signal_connect (window,
	                  "delete-event",
	                  G_CALLBACK (window_delete_event_cb),
	                  self);
	g_signal_connect (window,
	                  "focus-out-event",
	                  G_CALLBACK (window_focus_out_event_cb),
	                  self);

	GtkWidget *mainBox = gtk_vbox_new (FALSE, 0);
	gtk_container_set_border_width (GTK_CONTAINER (mainBox), 12);
	gtk_box_set_spacing (GTK_BOX (mainBox), 18);
	gtk_container_add (GTK_CONTAINER (window), mainBox);

	GtkPaned *paned = GTK_PANED (gtk_hpaned_new ());
	gtk_box_pack_start (GTK_BOX (mainBox),
	                    GTK_WIDGET (paned),
	                    TRUE, TRUE, 0);

	GtkWidget *listWidget = [self createPreambleList];
	GtkWidget *listFrame = gtk_frame_new (NULL);
	gtk_container_add (GTK_CONTAINER (listFrame), listWidget);

	GtkBox *listBox = GTK_BOX (gtk_vbox_new (FALSE, 0));
	gtk_box_set_spacing (listBox, 6);
	gtk_box_pack_start (listBox, listFrame, TRUE, TRUE, 0);

	GtkContainer *listButtonBox = GTK_CONTAINER (gtk_hbox_new (FALSE, 0));
	gtk_box_set_spacing (GTK_BOX (listButtonBox), 6);
	gtk_box_pack_start (listBox, GTK_WIDGET (listButtonBox), FALSE, TRUE, 0);
	GtkWidget *addButton = gtk_button_new_from_stock (GTK_STOCK_ADD);
	g_signal_connect (addButton,
	                  "clicked",
	                  G_CALLBACK (add_button_clicked_cb),
	                  self);
	gtk_container_add (listButtonBox, addButton);
	GtkWidget *removeButton = gtk_button_new_from_stock (GTK_STOCK_REMOVE);
	g_signal_connect (removeButton,
	                  "clicked",
	                  G_CALLBACK (remove_button_clicked_cb),
	                  self);
	gtk_container_add (listButtonBox, removeButton);

	gtk_paned_pack1 (paned, GTK_WIDGET (listBox), FALSE, TRUE);

	preambleView = GTK_TEXT_VIEW (gtk_text_view_new ());
	gtk_text_view_set_left_margin (preambleView, 3);
	gtk_text_view_set_right_margin (preambleView, 3);
	GtkWidget *scroller = gtk_scrolled_window_new (NULL, NULL);
	gtk_scrolled_window_set_policy (GTK_SCROLLED_WINDOW (scroller),
	        GTK_POLICY_AUTOMATIC, // horiz
	        GTK_POLICY_ALWAYS); // vert
	gtk_container_add (GTK_CONTAINER (scroller), GTK_WIDGET (preambleView));
	GtkWidget *editorFrame = gtk_frame_new (NULL);
	gtk_container_add (GTK_CONTAINER (editorFrame), scroller);
	gtk_paned_pack2 (paned, editorFrame, TRUE, TRUE);

	GtkContainer *buttonBox = GTK_CONTAINER (gtk_hbutton_box_new ());
	gtk_box_set_spacing (GTK_BOX (buttonBox), 6);
	gtk_button_box_set_layout (GTK_BUTTON_BOX (buttonBox), GTK_BUTTONBOX_END);
	gtk_box_pack_start (GTK_BOX (mainBox),
	                    GTK_WIDGET (buttonBox),
	                    FALSE, TRUE, 0);
	GtkWidget *closeButton = gtk_button_new_from_stock (GTK_STOCK_CLOSE);
	gtk_container_add (buttonBox, closeButton);
	g_signal_connect (closeButton,
	                  "clicked",
	                  G_CALLBACK (close_button_clicked_cb),
	                  self);
	/*
	GtkWidget *undoButton = gtk_button_new_from_stock (GTK_STOCK_UNDO);
	gtk_container_add (buttonBox, undoButton);
	gtk_button_box_set_child_secondary (GTK_BUTTON_BOX (buttonBox),
									    undoButton,
										TRUE);
	g_signal_connect (undoButton,
	                  "clicked",
	                  G_CALLBACK (undo_button_clicked_cb),
	                  self);
	GtkWidget *redoButton = gtk_button_new_from_stock (GTK_STOCK_REDO);
	gtk_container_add (buttonBox, redoButton);
	gtk_button_box_set_child_secondary (GTK_BUTTON_BOX (buttonBox),
									    redoButton,
										TRUE);
	g_signal_connect (redoButton,
	                  "clicked",
	                  G_CALLBACK (redo_button_clicked_cb),
	                  self);
					  */
	[self revert];

	gtk_widget_show_all (mainBox);
}

- (void) save {
	if (!preambleView)
		return;
	if ([self isDefaultPreambleSelected])
	    return;
	GtkTextIter start,end;
	GtkTextBuffer *preambleBuffer = gtk_text_view_get_buffer (preambleView);
	gtk_text_buffer_get_bounds(preambleBuffer, &start, &end);
	gchar *text = gtk_text_buffer_get_text(preambleBuffer, &start, &end, FALSE);
	NSString *preamble = [NSString stringWithUTF8String:text];
	g_free (text);
	[preambles setCurrentPreamble:preamble];
}

- (void) revert {
	if (!preambleView)
		return;
	GtkTextBuffer *preambleBuffer = gtk_text_view_get_buffer (preambleView);
	gtk_text_buffer_set_text (preambleBuffer, [[preambles currentPreamble] UTF8String], -1);
	gtk_text_view_set_editable (preambleView, ![self isDefaultPreambleSelected]);
}

- (void) update {
	if (!blockSignals) {
	    [self save];
	}
	GtkTreeSelection *sel = gtk_tree_view_get_selection (preambleSelector);
	GtkTreeIter row;
	GtkTreeModel *model;
	if (gtk_tree_selection_get_selected (sel, &model, &row)) {
	    gchar *name;
	    gtk_tree_model_get (model, &row, NAME_COLUMN, &name, -1);
	    NSString *preambleName = [NSString stringWithUTF8String:name];
	    [preambles setSelectedPreambleName:preambleName];
	    g_free (name);
	}
	[self revert];
}

- (void) fillListStore {
	blockSignals = YES;

	GtkTreeIter row;
	gtk_list_store_clear (preambleListStore);

	gtk_list_store_append (preambleListStore, &row);
	gtk_list_store_set (preambleListStore, &row,
	        NAME_COLUMN, [[preambles defaultPreambleName] UTF8String],
	        IS_CUSTOM_COLUMN, FALSE,
	        -1);
	GtkTreeSelection *sel = gtk_tree_view_get_selection (preambleSelector);
	if ([self isDefaultPreambleSelected]) {
	    gtk_tree_selection_select_iter (sel, &row);
	}

	NSEnumerator *en = [preambles customPreambleNameEnumerator];
	NSString *preambleName;
	while ((preambleName = [en nextObject])) {
	    gtk_list_store_append (preambleListStore, &row);
	    gtk_list_store_set (preambleListStore, &row,
	            NAME_COLUMN, [preambleName UTF8String],
	            IS_CUSTOM_COLUMN, TRUE,
	            -1);
	    if ([preambleName isEqualToString:[self selectedPreambleName]]) {
	        gtk_tree_selection_select_iter (sel, &row);
	    }
	}

	blockSignals = NO;
}

- (BOOL) isDefaultPreambleSelected {
	return [preambles selectedPreambleIsDefault];
}

- (NSString*) selectedPreambleName {
	return [preambles selectedPreambleName];
}

- (void) addPreamble {
	NSString *newName = [preambles addPreamble];

	GtkTreeIter row;
	gtk_list_store_append (preambleListStore, &row);
	gtk_list_store_set (preambleListStore, &row,
			NAME_COLUMN, [newName UTF8String],
			IS_CUSTOM_COLUMN, TRUE,
			-1);

	GtkTreeSelection *sel = gtk_tree_view_get_selection (preambleSelector);
	gtk_tree_selection_select_iter (sel, &row);
}

- (void) deletePreamble {
	if ([self isDefaultPreambleSelected])
		return;

	NSString *name = [self selectedPreambleName];

	GtkTreeIter row;
	GtkTreeModel *model = GTK_TREE_MODEL (preambleListStore);

	gtk_tree_model_get_iter_first (model, &row);
	// ignore first; it is the default one
	gboolean found = FALSE;
	while (!found && gtk_tree_model_iter_next (model, &row)) {
		gchar *candidate;
		gtk_tree_model_get (model, &row, NAME_COLUMN, &candidate, -1);
		if (g_strcmp0 (candidate, [name UTF8String]) == 0) {
			found = TRUE;
		}
		g_free (candidate);
	}

	if (!found)
		return;

	if (![preambles removePreamble:name])
		return;

	blockSignals = YES;

	gboolean had_next = gtk_list_store_remove (preambleListStore, &row);
	if (!had_next) {
		// select the last item
		gint length = gtk_tree_model_iter_n_children (model, NULL);
		gtk_tree_model_iter_nth_child (model, &row, NULL, length - 1);
	}

	GtkTreeSelection *sel = gtk_tree_view_get_selection (preambleSelector);
	gtk_tree_selection_select_iter (sel, &row);

	[self revert];

	blockSignals = NO;
}

- (void) renamePreambleAtPath:(gchar*)path to:(gchar*)newValue {
	NSString *newName = [NSString stringWithUTF8String:newValue];

	GtkTreeIter row;
	GtkTreeModel *model = GTK_TREE_MODEL (preambleListStore);

	if (!gtk_tree_model_get_iter_from_string (model, &row, path))
		return;

	gchar *oldValue;
	gtk_tree_model_get (model, &row, NAME_COLUMN, &oldValue, -1);

	NSString* oldName = [NSString stringWithUTF8String:oldValue];
	if ([preambles renamePreambleFrom:oldName to:newName]) {
		gtk_list_store_set (preambleListStore, &row,
				NAME_COLUMN, newValue,
				-1);
	}
}

- (void) nodeStylePropertyChanged:(NSNotification*)notification {
	if ([self isDefaultPreambleSelected]) {
		[self revert];
	}
}

- (void) edgeStylePropertyChanged:(NSNotification*)notification {
	if ([self isDefaultPreambleSelected]) {
		[self revert];
	}
}
@end

// }}}
// {{{ GTK+ callbacks

static gboolean window_delete_event_cb (GtkWidget *widget,
                                        GdkEvent  *event,
                                        PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor hide];
	[pool drain];
	return TRUE; // we dealt with this event
}

static gboolean window_focus_out_event_cb (GtkWidget *widget,
                                           GdkEvent  *event,
                                           PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor save];
	[pool drain];
	return FALSE;
}

static void close_button_clicked_cb (GtkButton *widget, PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor hide];
	[pool drain];
}

static void add_button_clicked_cb (GtkButton *widget, PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor addPreamble];
	[pool drain];
}

static void remove_button_clicked_cb (GtkButton *widget, PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor deletePreamble];
	[pool drain];
}

static void undo_button_clicked_cb (GtkButton *widget, PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	NSLog(@"Undo");
	[pool drain];
}

static void redo_button_clicked_cb (GtkButton *widget, PreambleEditor *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	NSLog(@"Redo");
	[pool drain];
}

static void preamble_name_edited_cb (GtkCellRendererText *renderer,
                                     gchar               *path,
                                     gchar               *new_text,
                                     PreambleEditor      *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor renamePreambleAtPath:path to:new_text];
	[pool drain];
}

static void preamble_selection_changed_cb (GtkTreeSelection *treeselection,
                                           PreambleEditor   *editor) {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[editor update];
	[pool drain];
}

// }}}

// vim:ft=objc:ts=4:noet:sts=4:sw=4:foldmethod=marker
