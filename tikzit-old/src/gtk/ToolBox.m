/*
 * Copyright 2012  Alex Merry <dev@randomguy3.me.uk>
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

#import "ToolBox.h"

#import "Application.h"
#import "Configuration.h"
#import "Tool.h"
#import "Window.h"

#import "gtkhelpers.h"
#import "tztoolpalette.h"

static void tool_button_toggled_cb (GtkWidget *widget, ToolBox *toolBox);

#define TOOL_DATA_KEY  "tikzit-tool"

@implementation ToolBox

- (id) init {
    [self release];
    return nil;
}

- (id) initWithTools:(NSArray*)tools {
    self = [super init];

    if (self) {
        window = gtk_window_new (GTK_WINDOW_TOPLEVEL);
        g_object_ref_sink (window);
        gtk_window_set_title (GTK_WINDOW (window), "Toolbox");
        gtk_window_set_role (GTK_WINDOW (window), "toolbox");
        gtk_window_set_type_hint (GTK_WINDOW (window),
                                  GDK_WINDOW_TYPE_HINT_UTILITY);
        gtk_window_set_deletable (GTK_WINDOW (window), FALSE);

        GtkWidget *mainLayout = gtk_vbox_new (FALSE, 5);
        gtk_widget_show (mainLayout);
        gtk_container_add (GTK_CONTAINER (window), mainLayout);

        GtkWidget *toolPalette = tz_tool_palette_new ();
        gtk_widget_show (toolPalette);
        gtk_box_pack_start (GTK_BOX (mainLayout),
                            toolPalette,
                            FALSE,
                            FALSE,
                            0);
        gtk_tool_palette_set_style (GTK_TOOL_PALETTE (toolPalette),
                                    GTK_TOOLBAR_ICONS);

        toolGroup = GTK_TOOL_ITEM_GROUP (gtk_tool_item_group_new ("Tools"));
        g_object_ref_sink (G_OBJECT (toolGroup));
        gtk_tool_item_group_set_label_widget (
                toolGroup,
                NULL);
        gtk_container_add (GTK_CONTAINER (toolPalette), GTK_WIDGET (toolGroup));
        gtk_widget_show (GTK_WIDGET (toolGroup));

        GSList *item_group = NULL;
        for (id<Tool> tool in tools) {
            NSString *tooltip = [NSString stringWithFormat:
                @"%@: %@ (%@)",
                [tool name], [tool helpText], [tool shortcut]];
            GtkToolItem *item = gtk_radio_tool_button_new_from_stock (
                    item_group,
                    [tool stockId]);
            gtk_tool_item_set_tooltip_text (item, [tooltip UTF8String]);
            item_group = gtk_radio_tool_button_get_group (
                    GTK_RADIO_TOOL_BUTTON (item));
            gtk_tool_item_group_insert (
                    toolGroup,
                    item,
                    -1);
            gtk_widget_show (GTK_WIDGET (item));
            g_object_set_data_full (
                    G_OBJECT(item),
                    TOOL_DATA_KEY,
                    [tool retain],
                    release_obj);

            g_signal_connect (item, "toggled",
                              G_CALLBACK (tool_button_toggled_cb),
                              self);
        }

        GtkWidget *sep = gtk_hseparator_new ();
        gtk_widget_show (sep);
        gtk_box_pack_start (GTK_BOX (mainLayout),
                            sep,
                            FALSE,
                            FALSE,
                            0);

        titleLabel = gtk_label_new ("");
        g_object_ref_sink (titleLabel);
        gtk_widget_show (titleLabel);

        PangoAttrList *attrs = pango_attr_list_new ();
        pango_attr_list_insert (attrs,
                pango_attr_weight_new (PANGO_WEIGHT_SEMIBOLD));
        gtk_label_set_attributes (GTK_LABEL (titleLabel), attrs);
        pango_attr_list_unref (attrs);

        gtk_box_pack_start (GTK_BOX (mainLayout),
                            titleLabel,
                            FALSE,
                            FALSE,
                            0);

        configWidgetContainer = gtk_alignment_new (0.5, 0.5, 1.0, 1.0);
        g_object_ref_sink (configWidgetContainer);
        gtk_widget_show (configWidgetContainer);
        gtk_box_pack_start (GTK_BOX (mainLayout),
                            configWidgetContainer,
                            TRUE,
                            TRUE,
                            0);
        gtk_alignment_set_padding (GTK_ALIGNMENT (configWidgetContainer),
                                   5, 5, 5, 5);

        gint button_width;
        gint button_height;

        if (tz_tool_palette_get_button_size (TZ_TOOL_PALETTE (toolPalette),
                                             &button_width, &button_height))
        {
            GdkGeometry geometry;

            geometry.min_width   = 2 * button_width;
            geometry.min_height  = -1;
            geometry.base_width  = button_width;
            geometry.base_height = 0;
            geometry.width_inc   = button_width;
            geometry.height_inc  = 1;

            gtk_window_set_geometry_hints (GTK_WINDOW (window),
                                           NULL,
                                           &geometry,
                                           GDK_HINT_MIN_SIZE   |
                                           GDK_HINT_BASE_SIZE  |
                                           GDK_HINT_RESIZE_INC |
                                           GDK_HINT_USER_POS);
        }
        gtk_window_set_default_size (GTK_WINDOW (window), button_width * 5, 500);

        // hack to position the toolbox window somewhere sensible
        // (upper left)
        gtk_window_parse_geometry (GTK_WINDOW (window), "+0+0");
    }

    return self;
}

- (void) dealloc {
    if (window) {
        g_object_unref (G_OBJECT (toolGroup));
        g_object_unref (G_OBJECT (titleLabel));
        g_object_unref (G_OBJECT (configWidgetContainer));
        if (configWidget)
            g_object_unref (G_OBJECT (configWidget));
        gtk_widget_destroy (window);
        g_object_unref (G_OBJECT (window));
    }

    [super dealloc];
}

- (id<Tool>) selectedTool {
    guint count = gtk_tool_item_group_get_n_items (toolGroup);
    for (guint i = 0; i < count; ++i) {
        GtkToolItem *item = gtk_tool_item_group_get_nth_item (toolGroup, i);
        if (gtk_toggle_tool_button_get_active (GTK_TOGGLE_TOOL_BUTTON (item))) {
            return (id)g_object_get_data (G_OBJECT (item), TOOL_DATA_KEY);
        }
    }
    return nil;
}

- (void) _setToolWidget:(GtkWidget*)widget {
    if (configWidget) {
        gtk_widget_hide (configWidget);
        gtk_container_remove (GTK_CONTAINER (configWidgetContainer),
                              configWidget);
        g_object_unref (configWidget);
    }
    configWidget = widget;
    if (configWidget) {
        g_object_ref (configWidget);
        gtk_container_add (GTK_CONTAINER (configWidgetContainer),
                           configWidget);
        gtk_widget_show (configWidget);
    }
}

- (void) setSelectedTool:(id<Tool>)tool {
    guint count = gtk_tool_item_group_get_n_items (toolGroup);
    for (guint i = 0; i < count; ++i) {
        GtkToolItem *item = gtk_tool_item_group_get_nth_item (toolGroup, i);
        id<Tool> data = (id)g_object_get_data (G_OBJECT (item), TOOL_DATA_KEY);
        if (data == tool) {
            gtk_toggle_tool_button_set_active (
                    GTK_TOGGLE_TOOL_BUTTON (item),
                    TRUE);
            break;
        }
    }
    gtk_label_set_label (GTK_LABEL (titleLabel),
                         [[tool name] UTF8String]);
    [self _setToolWidget:[tool configurationWidget]];
}

- (void) show {
    gtk_widget_show (window);
}

- (void) present {
    gtk_window_present (GTK_WINDOW (window));
}

- (void) attachToWindow:(Window*)parent {
    utility_window_attach (GTK_WINDOW (window), [parent gtkWindow]);
}

- (void) loadConfiguration:(Configuration*)config {
    if ([config hasGroup:@"ToolBox"]) {
        tz_restore_window (GTK_WINDOW (window),
                [config integerEntry:@"x" inGroup:@"ToolBox"],
                [config integerEntry:@"y" inGroup:@"ToolBox"],
                [config integerEntry:@"w" inGroup:@"ToolBox"],
                [config integerEntry:@"h" inGroup:@"ToolBox"]);
    }
}

- (void) saveConfiguration:(Configuration*)config {
    gint x, y, w, h;

    gtk_window_get_position (GTK_WINDOW (window), &x, &y);
    gtk_window_get_size (GTK_WINDOW (window), &w, &h);

    [config setIntegerEntry:@"x" inGroup:@"ToolBox" value:x];
    [config setIntegerEntry:@"y" inGroup:@"ToolBox" value:y];
    [config setIntegerEntry:@"w" inGroup:@"ToolBox" value:w];
    [config setIntegerEntry:@"h" inGroup:@"ToolBox" value:h];
}

@end

static void tool_button_toggled_cb (GtkWidget *widget, ToolBox *toolBox) {
    if (gtk_toggle_tool_button_get_active (GTK_TOGGLE_TOOL_BUTTON (widget))) {
        NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

        id<Tool> tool = (id)g_object_get_data (G_OBJECT(widget), TOOL_DATA_KEY);
        [app setActiveTool:tool];
        NSDictionary *userInfo = [NSDictionary
            dictionaryWithObject:tool
                          forKey:@"tool"];
        [[NSNotificationCenter defaultCenter]
            postNotificationName:@"ToolSelectionChanged"
                          object:toolBox
                        userInfo:userInfo];

        [pool drain];
    }
}

// vim:ft=objc:ts=8:et:sts=4:sw=4
