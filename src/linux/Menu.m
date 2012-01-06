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

#import "Menu.h"

#import "MainWindow.h"
#import "GraphInputHandler.h"
#import "Configuration.h"
#import "PickSupport.h"
#import "Shape.h"
#import "TikzDocument.h"

#import <glib.h>
#ifdef _
#undef _
#endif
#import <glib/gi18n.h>
#import <gtk/gtk.h>

#import "gtkhelpers.h"

#define ACTION_GROUP_STATIC              "TZStatic"
#define ACTION_GROUP_DOCUMENT            "TZDocument"
#define ACTION_GROUP_DOCUMENTS_LIST_MENU "TZDocumentsList"


// {{{ Callbacks

static void new_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window loadEmptyDocument];
    [pool drain];
}

static void open_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window openFile];
    [pool drain];
}

static void save_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window saveActiveDocument];
    [pool drain];
}

static void save_as_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window saveActiveDocumentAs];
    [pool drain];
}

static void save_as_shape_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window saveActiveDocumentAsShape];
    [pool drain];
}

static void refresh_shapes_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [Shape refreshShapeDictionary];
    [pool drain];
}

static void quit_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window quit];
    [pool drain];
}

static void help_cb (GtkAction *action, MainWindow *window) {
    GError *gerror = NULL;
    gtk_show_uri (NULL, "http://tikzit.sourceforge.net/manual.html", GDK_CURRENT_TIME, &gerror);
    if (gerror != NULL) {
        NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
        logGError (gerror, @"Could not show help");
        [pool drain];
    }
}

static void about_cb (GtkAction *action, MainWindow *window) {
    static const gchar * const authors[] =
        { "Aleks Kissinger <aleks0@gmail.com>",
          "Chris Heunen <chrisheunen@gmail.com>",
          "Alex Merry <dev@randomguy3.me.uk>",
          NULL };

    static const gchar license[] =
        N_("TikZiT is free software; you can redistribute it and/or modify "
          "it under the terms of the GNU General Public License as "
          "published by the Free Software Foundation; either version 2 of the "
          "License, or (at your option) any later version."
          "\n\n"
          "TikZiT is distributed in the hope that it will be useful, "
          "but WITHOUT ANY WARRANTY; without even the implied warranty of "
          "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the "
          "GNU General Public License for more details."
          "\n\n"
          "You should have received a copy of the GNU General Public License "
          "along with TikZiT; if not, write to the Free Software "
          "Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, "
          "MA 02110-1301, USA.");

    static const gchar copyright[] =
        "Copyright \xc2\xa9 2010-2011 Aleks Kissinger, Chris Heunen and Alex Merry.";

    gtk_show_about_dialog (GTK_WINDOW ([window gtkWindow]),
                   "name", g_get_application_name (),
                   "logo-icon-name", "tikzit",
                   "authors", authors,
                   "translator-credits", _("translator-credits"),
                   "comments", _("A graph manipulation program for pgf/tikz graphs"),
                   "license", _(license),
                   "wrap-license", TRUE,
                   "copyright", copyright,
                   "version", PACKAGE_VERSION,
                   "website", "http://tikzit.sourceforge.net",
                   NULL);
}

static void undo_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    TikzDocument *document = [window activeDocument];
    if ([document canUndo]) {
        [document undo];
    } else {
        g_warning ("Can't undo!\n");
        gtk_action_set_sensitive (action, FALSE);
    }

    [pool drain];
}

static void redo_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    TikzDocument *document = [window activeDocument];
    if ([document canRedo]) {
        [document redo];
    } else {
        g_warning ("Can't redo!\n");
        gtk_action_set_sensitive (action, FALSE);
    }

    [pool drain];
}

static void cut_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window cut];
    [pool drain];
}

static void copy_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window copy];
    [pool drain];
}

static void paste_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window paste];
    [pool drain];
}

static void delete_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [[window activeDocument] removeSelected];
    [pool drain];
}

static void select_all_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    TikzDocument *document = [window activeDocument];
    [[document pickSupport] selectAllNodes:[[document graph] nodes]];
    [pool drain];
}

static void deselect_all_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    TikzDocument *document = [window activeDocument];
    [[document pickSupport] deselectAllNodes];
    [[document pickSupport] deselectAllEdges];
    [pool drain];
}

static void flip_horiz_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [[window activeDocument] flipSelectedNodesHorizontally];
    [pool drain];
}

static void flip_vert_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [[window activeDocument] flipSelectedNodesVertically];
    [pool drain];
}

static void show_preamble_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window editPreambles];
    [pool drain];
}

static void zoom_in_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window zoomIn];
    [pool drain];
}

static void zoom_out_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window zoomOut];
    [pool drain];
}

static void zoom_reset_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window zoomReset];
    [pool drain];
}

#ifdef HAVE_POPPLER
static void show_preview_cb (GtkAction *action, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window showPreview];
    [pool drain];
}
#endif

static void input_mode_change_cb (GtkRadioAction *action, GtkRadioAction *current, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [[window graphInputHandler] setMode:(InputMode)gtk_radio_action_get_current_value (action)];
    [pool drain];
}

static void toolbar_style_change_cb (GtkRadioAction *action, GtkRadioAction *current, Menu *menu) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    gint value = gtk_radio_action_get_current_value (action);
    gtk_toolbar_set_style (GTK_TOOLBAR ([menu toolbar]), (GtkToolbarStyle)value);
    [[[menu mainWindow] mainConfiguration] setIntegerEntry:@"toolbarStyle" inGroup:@"UI" value:value];

    [pool drain];
}

static void recent_chooser_item_activated_cb (GtkRecentChooser *chooser, MainWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    gchar *uri, *path;
    GError *error = NULL;

    uri = gtk_recent_chooser_get_current_uri (chooser);

    path = g_filename_from_uri (uri, NULL, NULL);
    if (error) {
        g_warning ("Could not convert uri \"%s\" to a local path: %s", uri, error->message);
        g_error_free (error);
        return;
    }

    NSString *nspath = [NSString stringWithGlibFilename:path];
    if (error) {
        g_warning ("Could not convert filename \"%s\" to an NSString: %s", path, error->message);
        g_error_free (error);
        return;
    }
    [window loadDocumentFromFile:nspath];

    g_free (uri);
    g_free (path);

    [pool drain];
}



// }}}
// {{{ UI XML

static const gchar ui_info[] =
"<ui>"
"  <menubar name='MenuBar'>"
"    <menu action='FileMenu'>"
"      <menuitem action='New'/>"
"      <menuitem action='Open'/>"
"      <menuitem action='OpenRecent'/>"
"      <separator/>"
"      <menuitem action='Save'/>"
"      <menuitem action='SaveAs'/>"
"      <separator/>"
"      <menuitem action='SaveAsShape'/>"
"      <menuitem action='RefreshShapes'/>"
"      <separator/>"
//"      <menuitem action='Close'/>"
"      <menuitem action='Quit'/>"
"    </menu>"
"    <menu action='EditMenu'>"
"      <menu action='Tool'>"
"        <menuitem action='SelectMode'/>"
"        <menuitem action='CreateNodeMode'/>"
"        <menuitem action='DrawEdgeMode'/>"
"        <menuitem action='BoundingBoxMode'/>"
"        <menuitem action='HandMode'/>"
"      </menu>"
"      <separator/>"
"      <menuitem action='Undo'/>"
"      <menuitem action='Redo'/>"
"      <separator/>"
"      <menuitem action='Cut'/>"
"      <menuitem action='Copy'/>"
"      <menuitem action='Paste'/>"
"      <menuitem action='Delete'/>"
"      <separator/>"
"      <menuitem action='SelectAll'/>"
"      <menuitem action='DeselectAll'/>"
"      <separator/>"
"      <menuitem action='FlipVert'/>"
"      <menuitem action='FlipHoriz'/>"
"    </menu>"
"    <menu action='ViewMenu'>"
"      <menu action='ToolbarStyle'>"
"        <menuitem action='ToolbarIconsOnly'/>"
"        <menuitem action='ToolbarTextOnly'/>"
"        <menuitem action='ToolbarTextIcons'/>"
"        <menuitem action='ToolbarTextIconsHoriz'/>"
"      </menu>"
/*
"      <menuitem action='ToolbarVisible'/>"
"      <menuitem action='StatusbarVisible'/>"
*/
"      <menuitem action='ShowPreamble'/>"
#ifdef HAVE_POPPLER
"      <menuitem action='ShowPreview'/>"
#endif
"      <menu action='Zoom'>"
"        <menuitem action='ZoomIn'/>"
"        <menuitem action='ZoomOut'/>"
"        <menuitem action='ZoomReset'/>"
"      </menu>"
"    </menu>"
/*
"    <menu action='Window'>"
"      <placeholder name='DocumentsListPlaceholder'/>"
"    </menu>"
*/
"    <menu action='HelpMenu'>"
"      <menuitem action='HelpManual'/>"
"      <separator/>"
"      <menuitem action='About'/>"
"    </menu>"
"  </menubar>"
"  <toolbar  name='ToolBar'>"
"    <toolitem action='New'/>"
"    <toolitem action='Open'/>"
"    <toolitem action='Save'/>"
"    <separator/>"
"    <toolitem action='Cut'/>"
"    <toolitem action='Copy'/>"
"    <toolitem action='Paste'/>"
"    <separator/>"
"    <toolitem action='SelectMode'/>"
"    <toolitem action='CreateNodeMode'/>"
"    <toolitem action='DrawEdgeMode'/>"
"    <toolitem action='BoundingBoxMode'/>"
"    <toolitem action='HandMode'/>"
"  </toolbar>"
"</ui>";



// }}}
// {{{ Actions

static GtkActionEntry static_entries[] = {
    /*
        Fields:
          * action name
          * stock id or name of icon for action
          * label for action (mark for translation with N_)
          * accelerator (as understood by gtk_accelerator_parse())
          * tooltip (mark for translation with N_)
          * callback
    */
    { "FileMenu", NULL, N_("_File") },
    { "EditMenu", NULL, N_("_Edit") },
    { "ViewMenu", NULL, N_("_View") },
    //{ "ProjectMenu", NULL, N_("_Projects") },
    { "HelpMenu", NULL, N_("_Help") },
    //{ "UndoMenu", NULL, NULL },
    //{ "RedoMenu", NULL, NULL },

    /* FileMenu */
    { "New", GTK_STOCK_NEW, NULL, "<control>N",
      N_("Create a new graph"), G_CALLBACK (new_cb) },

    { "Open", GTK_STOCK_OPEN, N_("_Open\342\200\246") ,"<control>O",
      N_("Open a graph"), G_CALLBACK (open_cb) },

    { "OpenRecent", NULL, N_("Open _Recent") },

    { "RefreshShapes", NULL, N_("_Refresh shapes"), NULL,
      N_(""), G_CALLBACK (refresh_shapes_cb) },

    { "Quit", GTK_STOCK_QUIT, NULL, "<control>Q",
      N_("Quit the program"), G_CALLBACK (quit_cb) },

    /* EditMenu */
    { "Tool", NULL, N_("_Tool") },

    /* ViewMenu */
    { "ToolbarStyle", NULL, N_("_Toolbar style") },

    { "ShowPreamble", NULL, N_("_Edit Preambles..."), NULL,
      N_("Edit the preambles used to generate the preview"), G_CALLBACK (show_preamble_cb) },

    { "Zoom", NULL, N_("_Zoom") },

    { "ZoomIn", GTK_STOCK_ZOOM_IN, NULL, "<control>plus",
      NULL, G_CALLBACK (zoom_in_cb) },

    { "ZoomOut", GTK_STOCK_ZOOM_OUT, NULL, "<control>minus",
      NULL, G_CALLBACK (zoom_out_cb) },

    { "ZoomReset", GTK_STOCK_ZOOM_100, N_("_Reset zoom"), "<control>0",
      NULL, G_CALLBACK (zoom_reset_cb) },

    /* HelpMenu */
    { "HelpManual", GTK_STOCK_HELP, N_("_Online manual"), "F1",
      N_("TikZiT manual (online)"), G_CALLBACK (help_cb) },

    { "About", GTK_STOCK_ABOUT, NULL, NULL,
      N_("About this application"), G_CALLBACK (about_cb) },
};

static guint n_static_entries = G_N_ELEMENTS (static_entries);

static GtkActionEntry document_entries[] = {

    /* FileMenu */
    { "Save", GTK_STOCK_SAVE, NULL, "<control>S",
      N_("Save the current graph"), G_CALLBACK (save_cb) },

    { "SaveAs", GTK_STOCK_SAVE_AS, N_("Save _As\342\200\246"), NULL,
      N_("Save the current graph with a different name"), G_CALLBACK (save_as_cb) },

    { "SaveAsShape", NULL, N_("Save As S_hape\342\200\246"), NULL,
      N_("Save the current graph as a shape for use in styles"), G_CALLBACK (save_as_shape_cb) },

/*
    { "Close", GTK_STOCK_CLOSE, NULL, "<control>W",
      N_("Close the current graph"), G_CALLBACK (close_cb) },
*/

    /* EditMenu */
    { "Undo", GTK_STOCK_UNDO, NULL, "<control>Z",
      N_("Undo the last action"),   G_CALLBACK (undo_cb) },

    { "Redo", GTK_STOCK_REDO, NULL, "<shift><control>Z",
      N_("Redo the last action"),   G_CALLBACK (redo_cb) },

    { "Cut", GTK_STOCK_CUT, NULL, NULL,
      N_("Cut the selection"), G_CALLBACK (cut_cb) },

    { "Copy", GTK_STOCK_COPY, NULL, NULL,
      N_("Copy the selection"), G_CALLBACK (copy_cb) },

    { "Paste", GTK_STOCK_PASTE, NULL, NULL,
      N_("Paste the clipboard"), G_CALLBACK (paste_cb) },

    { "Delete", GTK_STOCK_DELETE, NULL, "Delete",
      N_("Delete the selection"), G_CALLBACK (delete_cb) },

    { "SelectAll", GTK_STOCK_SELECT_ALL, NULL, "<control>A",
      N_("Select all nodes on the graph"), G_CALLBACK (select_all_cb) },

    { "DeselectAll", NULL, N_("D_eselect all"), "<shift><control>A",
      N_("Deselect everything"), G_CALLBACK (deselect_all_cb) },

    { "FlipHoriz", NULL, N_("Flip nodes _horizonally"), NULL,
      N_("Flip the selected nodes horizontally"), G_CALLBACK (flip_horiz_cb) },

    { "FlipVert", NULL, N_("Flip nodes _vertically"), NULL,
      N_("Flip the selected nodes vertically"), G_CALLBACK (flip_vert_cb) },

    /* ViewMenu */
#ifdef HAVE_POPPLER
    { "ShowPreview", NULL, N_("_Preview"), "<control>L",
      N_("See the graph as it will look when rendered in LaTeX"), G_CALLBACK (show_preview_cb) },
#endif
};
static guint n_document_entries = G_N_ELEMENTS (document_entries);

static GtkRadioActionEntry mode_entries[] = {
    /*
        Fields:
          * action name
          * stock id or name of icon for action
          * label for action (mark for translation with N_)
          * accelerator (as understood by gtk_accelerator_parse())
          * tooltip (mark for translation with N_)
          * value (see gtk_radio_action_get_current_value())
    */

    { "SelectMode", NULL, N_("_Select"), "<control><shift>s",
      N_("Select, move and edit nodes and edges"), (gint)SelectMode },

    { "CreateNodeMode", NULL, N_("_Create nodes"), "<control><shift>c",
      N_("Create new nodes"), (gint)CreateNodeMode },

    { "DrawEdgeMode", NULL, N_("_Draw edges"), "<control><shift>e",
      N_("Draw new edges"), (gint)DrawEdgeMode },

    { "BoundingBoxMode", NULL, N_("_Bounding box"), "<control><shift>x",
      N_("Set the bounding box"), (gint)BoundingBoxMode },

    { "HandMode", NULL, N_("_Pan"), "<control><shift>f",
      N_("Move the diagram to view different parts"), (gint)HandMode },
};
static guint n_mode_entries = G_N_ELEMENTS (mode_entries);

static GtkRadioActionEntry toolbar_style_entries[] = {
    /*
        Fields:
          * action name
          * stock id or name of icon for action
          * label for action (mark for translation with N_)
          * accelerator (as understood by gtk_accelerator_parse())
          * tooltip (mark for translation with N_)
          * value (see gtk_radio_action_get_current_value())
    */

    { "ToolbarIconsOnly", NULL, N_("_Icons only"), NULL,
      N_("Show only icons on the toolbar"), (gint)GTK_TOOLBAR_ICONS },

    { "ToolbarTextOnly", NULL, N_("_Text only"), NULL,
      N_("Show only text on the toolbar"), (gint)GTK_TOOLBAR_TEXT },

    { "ToolbarTextIcons", NULL, N_("Text _below icons"), NULL,
      N_("Show icons on the toolbar with text below"), (gint)GTK_TOOLBAR_BOTH },

    { "ToolbarTextIconsHoriz", NULL, N_("Text be_side icons"), NULL,
      N_("Show icons on the toolbar with text beside"), (gint)GTK_TOOLBAR_BOTH_HORIZ },
};
static guint n_toolbar_style_entries = G_N_ELEMENTS (toolbar_style_entries);

// }}}
// {{{ Helper methods


static void
set_tool_button_image (GtkToolButton *button, const gchar *image_file)
{
    GtkWidget *image = NULL;

    if (image_file) {
        gchar *image_path = g_build_filename (TIKZITSHAREDIR, image_file, NULL);
        image = gtk_image_new_from_file (image_path);
        g_free (image_path);
    }

    gtk_tool_button_set_icon_widget (button, image);

    if (image) {
        gtk_widget_show (image);
    }
}

GtkWidget *
create_recent_chooser_menu ()
{
    GtkWidget *recent_menu;
    GtkRecentFilter *filter;

    recent_menu = gtk_recent_chooser_menu_new_for_manager (gtk_recent_manager_get_default ());

    gtk_recent_chooser_set_local_only (GTK_RECENT_CHOOSER (recent_menu), TRUE);
    gtk_recent_chooser_set_show_icons (GTK_RECENT_CHOOSER (recent_menu), FALSE);
    gtk_recent_chooser_set_sort_type (GTK_RECENT_CHOOSER (recent_menu), GTK_RECENT_SORT_MRU);
    gtk_recent_chooser_menu_set_show_numbers (GTK_RECENT_CHOOSER_MENU (recent_menu), TRUE);

    filter = gtk_recent_filter_new ();
    gtk_recent_filter_add_application (filter, g_get_application_name());
    gtk_recent_chooser_set_filter (GTK_RECENT_CHOOSER (recent_menu), filter);

    return recent_menu;
}



// }}}
// {{{ API

@implementation Menu

- (id) initForMainWindow:(MainWindow*)window
{
    self = [super init];
    if (!self) {
        return nil;
    }

    mainWindow = window;

    GError *error = NULL;

    staticActions = gtk_action_group_new (ACTION_GROUP_STATIC);
    //gtk_action_group_set_translation_domain (staticActions, GETTEXT_PACKAGE);

    gtk_action_group_add_actions (staticActions,
                      static_entries,
                      n_static_entries,
                      window);
    gtk_action_group_add_radio_actions (staticActions, mode_entries,
                        n_mode_entries, (gint)SelectMode,
                        G_CALLBACK (input_mode_change_cb), window);
    GtkToolbarStyle style;
    g_object_get (G_OBJECT (gtk_settings_get_default ()), "gtk-toolbar-style", &style, NULL);
    gtk_action_group_add_radio_actions (staticActions, toolbar_style_entries,
                        n_toolbar_style_entries, style,
                        G_CALLBACK (toolbar_style_change_cb), self);

    documentActions = gtk_action_group_new (ACTION_GROUP_DOCUMENT);
    //gtk_action_group_set_translation_domain (documentActions, GETTEXT_PACKAGE);

    gtk_action_group_add_actions (documentActions,
                      document_entries,
                      n_document_entries,
                      window);

    /*
    documents_list_menu_actions =
        gtk_action_group_new (ACTION_GROUP_DOCUMENTS_LIST_MENU);
    gtk_action_group_set_translation_domain (documents_list_menu_actions,
                         GETTEXT_PACKAGE);
    */

    ui = gtk_ui_manager_new ();

    gtk_ui_manager_insert_action_group (ui, staticActions, 0);
    gtk_ui_manager_insert_action_group (ui, documentActions, 1);
    //gtk_ui_manager_insert_action_group (ui, documents_list_menu_actions, 3);

    gtk_window_add_accel_group ([window gtkWindow], gtk_ui_manager_get_accel_group (ui));

    if (!gtk_ui_manager_add_ui_from_string (ui, ui_info, -1, &error))
    {
        g_message ("Building menus failed: %s", error->message);
        g_error_free (error);
        return NULL;
    }

    /* Set custom images for tool mode buttons */
    set_tool_button_image (GTK_TOOL_BUTTON (gtk_ui_manager_get_widget (ui, "/ToolBar/SelectMode")), "select-rectangular.png");
    set_tool_button_image (GTK_TOOL_BUTTON (gtk_ui_manager_get_widget (ui, "/ToolBar/CreateNodeMode")), "draw-ellipse.png");
    set_tool_button_image (GTK_TOOL_BUTTON (gtk_ui_manager_get_widget (ui, "/ToolBar/DrawEdgeMode")), "draw-path.png");
    set_tool_button_image (GTK_TOOL_BUTTON (gtk_ui_manager_get_widget (ui, "/ToolBar/BoundingBoxMode")), "transform-crop-and-resize.png");
    set_tool_button_image (GTK_TOOL_BUTTON (gtk_ui_manager_get_widget (ui, "/ToolBar/HandMode")), "transform-move.png");

    /* Save the undo and redo actions so they can be updated */
    undoAction = gtk_action_group_get_action (documentActions, "Undo");
    redoAction = gtk_action_group_get_action (documentActions, "Redo");
    pasteAction = gtk_action_group_get_action (documentActions, "Paste");

    /* Recent items */
    GtkWidget *recentMenu = create_recent_chooser_menu();
    GtkMenuItem *recentMenuItem = GTK_MENU_ITEM (gtk_ui_manager_get_widget (ui, "/MenuBar/FileMenu/OpenRecent"));
    gtk_menu_item_set_submenu (recentMenuItem, recentMenu);
    g_signal_connect (recentMenu, "item-activated", G_CALLBACK (recent_chooser_item_activated_cb), window);

    nodeSelBasedActionCount = 4;
    nodeSelBasedActions = g_new (GtkAction*, nodeSelBasedActionCount);
    nodeSelBasedActions[0] = gtk_action_group_get_action (documentActions, "Cut");
    nodeSelBasedActions[1] = gtk_action_group_get_action (documentActions, "Copy");
    nodeSelBasedActions[2] = gtk_action_group_get_action (documentActions, "FlipHoriz");
    nodeSelBasedActions[3] = gtk_action_group_get_action (documentActions, "FlipVert");
    selBasedActionCount = 2;
    selBasedActions = g_new (GtkAction*, selBasedActionCount);
    selBasedActions[0] = gtk_action_group_get_action (documentActions, "Delete");
    selBasedActions[1] = gtk_action_group_get_action (documentActions, "DeselectAll");

    Configuration *configFile = [window mainConfiguration];
    if ([configFile hasKey:@"toolbarStyle" inGroup:@"UI"]) {
        int value = [configFile integerEntry:@"toolbarStyle" inGroup:@"UI"];
        gtk_radio_action_set_current_value (
                GTK_RADIO_ACTION (gtk_action_group_get_action (staticActions, "ToolbarIconsOnly")),
                value);
    }

    return self;
}

- (GtkWidget*) menubar {
    return gtk_ui_manager_get_widget (ui, "/MenuBar");
}

- (GtkWidget*) toolbar {
    return gtk_ui_manager_get_widget (ui, "/ToolBar");
}

- (MainWindow*) mainWindow {
    return mainWindow;
}

- (void) setUndoActionEnabled:(BOOL)enabled {
    gtk_action_set_sensitive (undoAction, enabled);
}

- (void) setUndoActionDetail:(NSString*)detail {
    gtk_action_set_detailed_label (undoAction, "_Undo", [detail UTF8String]);
}

- (void) setRedoActionEnabled:(BOOL)enabled {
    gtk_action_set_sensitive (redoAction, enabled);
}

- (void) setRedoActionDetail:(NSString*)detail {
    gtk_action_set_detailed_label (redoAction, "_Redo", [detail UTF8String]);
}

- (GtkAction*) pasteAction {
    return pasteAction;
}

- (void) notifySelectionChanged:(PickSupport*)pickSupport {
    BOOL hasSelectedNodes = [[pickSupport selectedNodes] count] > 0;
    BOOL hasSelectedEdges = [[pickSupport selectedEdges] count] > 0;
    for (int i = 0; i < nodeSelBasedActionCount; ++i) {
        if (nodeSelBasedActions[i]) {
            gtk_action_set_sensitive (nodeSelBasedActions[i], hasSelectedNodes);
        }
    }
    for (int i = 0; i < selBasedActionCount; ++i) {
        if (selBasedActions[i]) {
            gtk_action_set_sensitive (selBasedActions[i], hasSelectedNodes || hasSelectedEdges);
        }
    }
}

- (void) dealloc {
    g_free (nodeSelBasedActions);
    g_free (selBasedActions);

    [super dealloc];
}

@end

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
