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

#import "ContextWindow.h"

#import "Configuration.h"
#import "EdgeStylesModel.h"
#import "NodeStylesModel.h"
#import "PropertiesPane.h"
#import "SelectionPane.h"
#import "StyleManager.h"

#import "gtkhelpers.h"

static gboolean props_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, ContextWindow *window);

@implementation ContextWindow

- (id) init {
    [self release];
    return nil;
}

- (id) initWithStyleManager:(StyleManager*)sm {
    return [self initWithNodeStylesModel:[NodeStylesModel modelWithStyleManager:sm]
                      andEdgeStylesModel:[EdgeStylesModel modelWithStyleManager:sm]];
}

- (id) initWithNodeStylesModel:(NodeStylesModel*)nsm
            andEdgeStylesModel:(EdgeStylesModel*)esm {
    self = [super init];

    if (self) {
        window = gtk_window_new (GTK_WINDOW_TOPLEVEL);
        g_object_ref_sink (window);
        gtk_window_set_title (GTK_WINDOW (window), "Context");
        gtk_window_set_role (GTK_WINDOW (window), "context");
        gtk_window_set_type_hint (GTK_WINDOW (window),
                                  GDK_WINDOW_TYPE_HINT_UTILITY);
        gtk_window_set_default_size (GTK_WINDOW (window), 200, 500);
        g_signal_connect (G_OBJECT (window),
            "delete-event",
            G_CALLBACK (props_window_delete_event_cb),
            self);

        layout = gtk_vbox_new (FALSE, 3);
        g_object_ref_sink (layout);
        gtk_widget_show (layout);
        gtk_container_set_border_width (GTK_CONTAINER (layout), 6);

        gtk_container_add (GTK_CONTAINER (window), layout);

        propsPane = [[PropertiesPane alloc] initWithNodeStylesModel:nsm
                                                 andEdgeStylesModel:esm];
        gtk_box_pack_start (GTK_BOX (layout), [propsPane gtkWidget],
                            TRUE, TRUE, 0);

        GtkWidget *sep = gtk_hseparator_new ();
        gtk_widget_show (sep);
        gtk_box_pack_start (GTK_BOX (layout), sep,
                            FALSE, FALSE, 0);

        selPane = [[SelectionPane alloc] initWithNodeStylesModel:nsm
                                              andEdgeStylesModel:esm];
        gtk_box_pack_start (GTK_BOX (layout), [selPane gtkWidget],
                            FALSE, FALSE, 0);

        // hack to position the context window somewhere sensible
        // (upper right)
        gtk_window_parse_geometry (GTK_WINDOW (window), "-0+0");
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    g_object_unref (layout);
    g_object_unref (window);

    [propsPane release];

    [super dealloc];
}

- (TikzDocument*) document {
    return [propsPane document];
}

- (void) setDocument:(TikzDocument*)doc {
    [propsPane setDocument:doc];
    [selPane setDocument:doc];
}

- (BOOL) visible {
    return gtk_widget_get_visible (window);
}

- (void) setVisible:(BOOL)visible {
    gtk_widget_set_visible (window, visible);
}

- (void) present {
    gtk_window_present (GTK_WINDOW (window));
}

- (void) loadConfiguration:(Configuration*)config {
    [propsPane loadConfiguration:config];
    [selPane loadConfiguration:config];

    if ([config hasGroup:@"ContextWindow"]) {
        tz_restore_window (GTK_WINDOW (window),
                [config integerEntry:@"x" inGroup:@"ContextWindow"],
                [config integerEntry:@"y" inGroup:@"ContextWindow"],
                [config integerEntry:@"w" inGroup:@"ContextWindow"],
                [config integerEntry:@"h" inGroup:@"ContextWindow"]);
    }
    [self setVisible:[config booleanEntry:@"visible"
                                  inGroup:@"ContextWindow"
                              withDefault:YES]];
}

- (void) saveConfiguration:(Configuration*)config {
    gint x, y, w, h;

    gtk_window_get_position (GTK_WINDOW (window), &x, &y);
    gtk_window_get_size (GTK_WINDOW (window), &w, &h);

    [config setIntegerEntry:@"x" inGroup:@"ContextWindow" value:x];
    [config setIntegerEntry:@"y" inGroup:@"ContextWindow" value:y];
    [config setIntegerEntry:@"w" inGroup:@"ContextWindow" value:w];
    [config setIntegerEntry:@"h" inGroup:@"ContextWindow" value:h];
    [config setBooleanEntry:@"visible"
                    inGroup:@"ContextWindow"
                      value:[self visible]];

    [propsPane saveConfiguration:config];
    [selPane saveConfiguration:config];
}

@end

static gboolean props_window_delete_event_cb (GtkWidget *widget, GdkEvent *event, ContextWindow *window) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [window setVisible:NO];
    [pool drain];
    return TRUE;
}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
