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

#import "TZFoundation.h"
#import <gtk/gtk.h>

@class Preambles;

@interface PreambleEditor: NSObject {
    Preambles     *preambles;

    // we don't keep any refs, as we control
    // the top window
    GtkWindow     *parentWindow;
    GtkWindow     *window;
    GtkListStore  *preambleListStore;
    GtkTreeView   *preambleSelector;
    GtkTextView   *preambleView;
    BOOL           blockSignals;
    BOOL           adding;
}

- (id) initWithPreambles:(Preambles*)p;

- (void) setParentWindow:(GtkWindow*)parent;

- (Preambles*) preambles;

- (void) show;
- (void) hide;
- (BOOL) isVisible;
- (void) setVisible:(BOOL)visible;

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
