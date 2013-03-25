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

#import "PreviewWindow.h"

#import "Preambles.h"
#import "PreviewRenderer.h"
#import "TikzDocument.h"
#import "WidgetSurface.h"

#import "gtkhelpers.h"

@interface PreviewWindow (Private)
- (BOOL) updateOrShowError;
- (void) updateDefaultSize;
@end

// {{{ API

@implementation PreviewWindow

- (id) init {
    [self release];
    return nil;
}

- (id) initWithPreambles:(Preambles*)p config:(Configuration*)c {
    self = [super init];

    if (self) {
        parent = NULL;
        previewer = [[PreviewRenderer alloc] initWithPreambles:p config:c];

        window = GTK_WINDOW (gtk_window_new (GTK_WINDOW_TOPLEVEL));
        gtk_window_set_title (window, "Preview");
        gtk_window_set_resizable (window, TRUE);
        gtk_window_set_default_size (window, 150.0, 150.0);
        g_signal_connect (G_OBJECT (window),
                          "delete-event",
                          G_CALLBACK (gtk_widget_hide_on_delete),
                          NULL);

        GtkWidget *pdfArea = gtk_drawing_area_new ();
        gtk_container_add (GTK_CONTAINER (window), pdfArea);
        gtk_widget_show (pdfArea);
        surface = [[WidgetSurface alloc] initWithWidget:pdfArea];
        [surface setRenderDelegate:previewer];
        Transformer *t = [surface transformer];
        [t setFlippedAboutXAxis:![t isFlippedAboutXAxis]];
    }

    return self;
}

- (void) setParentWindow:(GtkWindow*)p {
    parent = p;
    gtk_window_set_transient_for (window, p);
    if (p != NULL) {
        gtk_window_set_position (window, GTK_WIN_POS_CENTER_ON_PARENT);
    }
}

- (TikzDocument*) document {
    return [previewer document];
}

- (void) setDocument:(TikzDocument*)doc {
    [previewer setDocument:doc];
}

- (void) present {
    if ([self updateOrShowError]) {
        [self updateDefaultSize];
        gtk_window_present (GTK_WINDOW (window));
        [surface invalidate];
    }
}

- (BOOL) update {
    if ([self updateOrShowError]) {
        [self updateDefaultSize];
        return YES;
    }

    return NO;
}

- (void) show {
    if ([self updateOrShowError]) {
        [self updateDefaultSize];
        gtk_widget_show (GTK_WIDGET (window));
        [surface invalidate];
    }
}

- (void) hide {
    gtk_widget_hide (GTK_WIDGET (window));
}

- (BOOL) isVisible {
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
    [previewer release];
    [surface release];
    gtk_widget_destroy (GTK_WIDGET (window));

    [super dealloc];
}

@end
// }}}

@implementation PreviewWindow (Private)
- (BOOL) updateOrShowError {
    NSError *error = nil;
    if (![previewer updateWithError:&error]) {
        GtkWindow *dparent = gtk_widget_get_visible (GTK_WIDGET (window))
                           ? window
                           : parent;
        GtkWidget *dialog = gtk_message_dialog_new (dparent,
                                                    GTK_DIALOG_DESTROY_WITH_PARENT,
                                                    GTK_MESSAGE_ERROR,
                                                    GTK_BUTTONS_CLOSE,
                                                    "Failed to generate the preview: %s",
                                                    [[error localizedDescription] UTF8String]);
#if GTK_CHECK_VERSION(2,22,0)
        if ([error code] == TZ_ERR_TOOL_FAILED) {
            GtkBox *box = GTK_BOX (gtk_message_dialog_get_message_area (GTK_MESSAGE_DIALOG (dialog)));
            GtkWidget *label = gtk_label_new ("pdflatex said:");
            gtk_misc_set_alignment (GTK_MISC (label), 0, 0.5f);
            gtk_widget_show (label);
            gtk_box_pack_start (box, label, FALSE, TRUE, 0);

            GtkWidget *view = gtk_text_view_new ();
            GtkTextBuffer *buffer = gtk_text_view_get_buffer (GTK_TEXT_VIEW (view));
            gtk_text_buffer_set_text (buffer, [[error toolOutput] UTF8String], -1);
            gtk_text_view_set_editable (GTK_TEXT_VIEW (view), FALSE);
            gtk_widget_show (view);
            GtkWidget *scrolledView = gtk_scrolled_window_new (NULL, NULL);
            gtk_scrolled_window_set_policy (GTK_SCROLLED_WINDOW (scrolledView),
                                            GTK_POLICY_NEVER, // horiz
                                            GTK_POLICY_ALWAYS); // vert
            gtk_widget_set_size_request (scrolledView, -1, 120);
            gtk_container_add (GTK_CONTAINER (scrolledView), view);
            gtk_widget_show (scrolledView);
            gtk_box_pack_start (box, scrolledView, TRUE, TRUE, 0);
        }
#endif // GTK+ 2.22.0
        gtk_dialog_run (GTK_DIALOG (dialog));
        gtk_widget_destroy (dialog);
        return NO;
    }
    return YES;
}

- (void) updateDefaultSize {
    double width = 150;
    double height = 150;
    if ([previewer isValid]) {
        double pWidth = [previewer width];
        double pHeight = [previewer height];
        width = (width < pWidth + 4) ? pWidth + 4 : width;
        height = (height < pHeight + 4) ? pHeight + 4 : height;
    }
    gtk_window_set_default_size (window, width, height);
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
