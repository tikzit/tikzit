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

#import "StylesPane.h"

#import "Configuration.h"
#import "NodeStylesPalette.h"
#import "EdgeStylesPalette.h"

@interface StylesPane (Private)
- (void) _addSplitter;
- (GtkExpander*) _addExpanderWithName:(const gchar*)name contents:(GtkWidget*)contents;
@end

// {{{ API
@implementation StylesPane

@synthesize widget=stylesPane;

- (id) init {
    [self dealloc];
    self = nil;
    return nil;
}

- (id) initWithManager:(StyleManager*)m {
    self = [super init];

    if (self) {
        nodeStyles = [[NodeStylesPalette alloc] initWithManager:m];
        edgeStyles = [[EdgeStylesPalette alloc] initWithManager:m];

        stylesPane = gtk_vbox_new (FALSE, 0);
        g_object_ref_sink (stylesPane);

        nodeStylesExpander = [self _addExpanderWithName:"Node styles"
                                               contents:[nodeStyles widget]];
        g_object_ref_sink (nodeStylesExpander);
        [self _addSplitter];

        edgeStylesExpander = [self _addExpanderWithName:"Edge styles"
                                               contents:[edgeStyles widget]];
        g_object_ref_sink (edgeStylesExpander);
        [self _addSplitter];
    }

    return self;
}

- (void) dealloc {
    g_object_unref (stylesPane);

    [nodeStyles release];
    [edgeStyles release];

    [super dealloc];
}

- (TikzDocument*) document {
    return [nodeStyles document];
}

- (void) setDocument:(TikzDocument*)doc {
    [nodeStyles setDocument:doc];
    [edgeStyles setDocument:doc];
}

- (StyleManager*) styleManager {
    return [nodeStyles styleManager];
}

- (void) setStyleManager:(StyleManager*)m {
    [nodeStyles setStyleManager:m];
    [edgeStyles setStyleManager:m];
}

- (void) restoreUiStateFromConfig:(Configuration*)file group:(NSString*)group {
    gtk_expander_set_expanded (nodeStylesExpander,
            [file booleanEntry:@"node-styles-expanded"
                       inGroup:group
                   withDefault:YES]);
    gtk_expander_set_expanded (edgeStylesExpander,
            [file booleanEntry:@"edge-styles-expanded"
                       inGroup:group
                   withDefault:NO]);
}

- (void) saveUiStateToConfig:(Configuration*)file group:(NSString*)group {
    [file setBooleanEntry:@"node-styles-expanded"
                  inGroup:group
                    value:gtk_expander_get_expanded (nodeStylesExpander)];
    [file setBooleanEntry:@"edge-styles-expanded"
                  inGroup:group
                    value:gtk_expander_get_expanded (edgeStylesExpander)];
}

- (void) favourNodeStyles {
    if (!gtk_expander_get_expanded (nodeStylesExpander)) {
        if (gtk_expander_get_expanded (edgeStylesExpander)) {
            gtk_expander_set_expanded (edgeStylesExpander, FALSE);
            gtk_expander_set_expanded (nodeStylesExpander, TRUE);
        }
    }
}

- (void) favourEdgeStyles {
    if (!gtk_expander_get_expanded (edgeStylesExpander)) {
        if (gtk_expander_get_expanded (nodeStylesExpander)) {
            gtk_expander_set_expanded (nodeStylesExpander, FALSE);
            gtk_expander_set_expanded (edgeStylesExpander, TRUE);
        }
    }
}

@end

// }}}
// {{{ Private

@implementation StylesPane (Private)
- (void) _addSplitter {
    GtkWidget *split = gtk_hseparator_new ();
    gtk_box_pack_start (GTK_BOX (stylesPane),
                        split,
                        FALSE, // expand
                        FALSE, // fill
                        0); // padding
    gtk_widget_show (split);
}

- (GtkExpander*) _addExpanderWithName:(const gchar*)name contents:(GtkWidget*)contents {
    GtkWidget *exp = gtk_expander_new (name);
    gtk_box_pack_start (GTK_BOX (stylesPane),
                        exp,
                        FALSE, // expand
                        TRUE, // fill
                        0); // padding
    gtk_widget_show (exp);
    gtk_container_set_border_width (GTK_CONTAINER (contents), 6);
    gtk_container_add (GTK_CONTAINER (exp), contents);
    gtk_widget_show (contents);
    return GTK_EXPANDER (exp);
}
@end

// }}}

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
