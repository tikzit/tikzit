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

#import "EdgeStylesPalette.h"

#import "EdgeStyleSelector.h"
#import "EdgeStyleEditor.h"
#import "StyleManager.h"

// {{{ Internal interfaces
// {{{ GTK+ Callbacks
static void add_style_button_cb (GtkButton *widget, EdgeStylesPalette *palette);
static void remove_style_button_cb (GtkButton *widget, EdgeStylesPalette *palette);
// }}}
// {{{ Notifications

@interface EdgeStylesPalette (Notifications)
- (void) selectedStyleChanged:(NSNotification*)notification;
@end

// }}}
// {{{ Private

@interface EdgeStylesPalette (Private)
- (void) updateButtonState;
- (void) removeSelectedStyle;
@end

// }}}
// }}}
// {{{ API

@implementation EdgeStylesPalette

@synthesize widget=palette;

- (id) init {
    [self release];
    self = nil;
    return nil;
}

- (id) initWithManager:(StyleManager*)m {
    self = [super init];

    if (self) {
        selector = [[EdgeStyleSelector alloc] initWithStyleManager:m];
        editor = [[EdgeStyleEditor alloc] init];

        palette = gtk_vbox_new (FALSE, 6);
        gtk_container_set_border_width (GTK_CONTAINER (palette), 6);
        g_object_ref_sink (palette);

        GtkWidget *mainBox = gtk_hbox_new (FALSE, 0);
        gtk_box_pack_start (GTK_BOX (palette), mainBox, FALSE, FALSE, 0);
        gtk_widget_show (mainBox);

        GtkWidget *selectorScroller = gtk_scrolled_window_new (NULL, NULL);
        gtk_scrolled_window_set_policy (GTK_SCROLLED_WINDOW (selectorScroller),
                GTK_POLICY_NEVER,
                GTK_POLICY_AUTOMATIC);
        GtkWidget *selectorFrame = gtk_frame_new (NULL);
        gtk_container_add (GTK_CONTAINER (selectorScroller), [selector widget]);
        gtk_container_add (GTK_CONTAINER (selectorFrame), selectorScroller);
        gtk_box_pack_start (GTK_BOX (mainBox), selectorFrame, TRUE, TRUE, 0);
        gtk_widget_show (selectorScroller);
        gtk_widget_show (selectorFrame);
        gtk_widget_show ([selector widget]);

        gtk_box_pack_start (GTK_BOX (mainBox), [editor widget], TRUE, TRUE, 0);
        gtk_widget_show ([editor widget]);

        GtkBox *buttonBox = GTK_BOX (gtk_hbox_new(FALSE, 0));
        gtk_box_pack_start (GTK_BOX (palette), GTK_WIDGET (buttonBox), FALSE, FALSE, 0);

        GtkWidget *addStyleButton = gtk_button_new ();
        gtk_widget_set_tooltip_text (addStyleButton, "Add a new style");
        GtkWidget *addIcon = gtk_image_new_from_stock (GTK_STOCK_ADD, GTK_ICON_SIZE_BUTTON);
        gtk_container_add (GTK_CONTAINER (addStyleButton), addIcon);
        gtk_box_pack_start (buttonBox, addStyleButton, FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (addStyleButton),
            "clicked",
            G_CALLBACK (add_style_button_cb),
            self);

        removeStyleButton = gtk_button_new ();
        g_object_ref_sink (removeStyleButton);
        gtk_widget_set_tooltip_text (removeStyleButton, "Delete selected style");
        GtkWidget *removeIcon = gtk_image_new_from_stock (GTK_STOCK_REMOVE, GTK_ICON_SIZE_BUTTON);
        gtk_container_add (GTK_CONTAINER (removeStyleButton), removeIcon);
        gtk_box_pack_start (buttonBox, removeStyleButton, FALSE, FALSE, 0);
        g_signal_connect (G_OBJECT (removeStyleButton),
            "clicked",
            G_CALLBACK (remove_style_button_cb),
            self);

        gtk_widget_show_all (GTK_WIDGET (buttonBox));

        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(selectedStyleChanged:)
                                                     name:@"SelectedStyleChanged"
                                                   object:selector];

        [self updateButtonState];
    }

    return self;
}

- (StyleManager*) styleManager {
    return [[selector model] styleManager];
}

- (void) setStyleManager:(StyleManager*)m {
    [[selector model] setStyleManager:m];
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [editor release];
    [selector release];

    g_object_unref (palette);
    g_object_unref (removeStyleButton);

    [super dealloc];
}

@end

// }}}
// {{{ Notifications

@implementation EdgeStylesPalette (Notifications)
- (void) selectedStyleChanged:(NSNotification*)notification {
    [editor setStyle:[selector selectedStyle]];
    [self updateButtonState];
}
@end

// }}}
// {{{ Private

@implementation EdgeStylesPalette (Private)
- (void) updateButtonState {
    gboolean hasStyleSelection = [selector selectedStyle] != nil;
    gtk_widget_set_sensitive (removeStyleButton, hasStyleSelection);
}

- (void) removeSelectedStyle {
    EdgeStyle *style = [selector selectedStyle];
    if (style)
        [[[selector model] styleManager] removeEdgeStyle:style];
}

@end

// }}}
// {{{ GTK+ callbacks

static void add_style_button_cb (GtkButton *widget, EdgeStylesPalette *palette) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

    EdgeStyle *newStyle = [EdgeStyle defaultEdgeStyleWithName:@"newstyle"];
    [[palette styleManager] addEdgeStyle:newStyle];

    [pool drain];
}

static void remove_style_button_cb (GtkButton *widget, EdgeStylesPalette *palette) {
    NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
    [palette removeSelectedStyle];
    [pool drain];
}

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
