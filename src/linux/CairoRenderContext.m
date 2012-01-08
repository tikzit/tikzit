/*
 * Copyright 2011  Alex Merry <alex.merry@kdemail.net>
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

#import "CairoRenderContext.h"

#import "cairo_helpers.h"
#import "util.h"

#import <pango/pangocairo.h>

@implementation PangoTextLayout

- (id) init {
    [self release];
    self = nil;
    return nil;
}

+ (PangoTextLayout*) layoutForContext:(cairo_t*)cr withFontSize:(CGFloat)fontSize {
   return [[[self alloc] initWithContext:cr fontSize:fontSize] autorelease];
}

- (id) initWithContext:(cairo_t*)cr fontSize:(CGFloat)fontSize {
    self = [super init];

    if (self) {
        cairo_reference (cr);
        context = cr;
        layout =  pango_cairo_create_layout (cr);

        PangoFontDescription *font_desc = pango_font_description_new ();
        pango_font_description_set_family_static (font_desc, "Sans");
        pango_font_description_set_size (font_desc, pango_units_from_double (fontSize));
        pango_layout_set_font_description (layout, font_desc);
        pango_font_description_free (font_desc);
    }

    return self;
}

- (void) setText:(NSString*)text {
    pango_layout_set_text (layout, [text UTF8String], -1);
}

- (NSSize) size {
    int width, height;
    pango_layout_get_size (layout, &width, &height);
    return NSMakeSize (pango_units_to_double (width), pango_units_to_double (height));
}

- (NSString*) text {
    return [NSString stringWithUTF8String:pango_layout_get_text (layout)];
}

- (void) showTextAt:(NSPoint)topLeft withColor:(RColor)color {
    cairo_save (context);

    cairo_move_to(context, topLeft.x, topLeft.y);
    cairo_set_source_rcolor (context, color);
    pango_cairo_show_layout (context, layout);

    cairo_restore (context);
}

- (void) dealloc {
    if (layout)
        g_object_unref (G_OBJECT (layout));
    if (context)
        cairo_destroy (context);

    [super dealloc];
}

@end

@implementation CairoRenderContext

- (id) init {
    [self release];
    self = nil;
    return nil;
}

+ (CairoRenderContext*) contextForSurface:(cairo_surface_t*)surface {
    return [[[self alloc] initForSurface:surface] autorelease];
}

- (id) initForSurface:(cairo_surface_t*)surface {
    self = [super init];

    if (self) {
        context = cairo_create (surface);
    }

    return self;
}

+ (CairoRenderContext*) contextForWidget:(GtkWidget*)widget {
    return [[[self alloc] initForWidget:widget] autorelease];
}

- (id) initForWidget:(GtkWidget*)widget {
    self = [super init];

    if (self) {
        GdkWindow *window = gtk_widget_get_window (widget);
        if (window) {
            context = gdk_cairo_create (window);
        } else {
            [self release];
            self = nil;
        }
    }

    return self;
}

+ (CairoRenderContext*) contextForDrawable:(GdkDrawable*)d {
    return [[[self alloc] initForDrawable:d] autorelease];
}

- (id) initForDrawable:(GdkDrawable*)d {
    self = [super init];

    if (self) {
        context = gdk_cairo_create (d);
    }

    return self;
}

+ (CairoRenderContext*) contextForPixbuf:(GdkPixbuf*)pixbuf {
    return [[[self alloc] initForPixbuf:pixbuf] autorelease];
}

- (id) initForPixbuf:(GdkPixbuf*)pixbuf {
    self = [super init];

    if (self) {
        cairo_format_t format = -1;

        if (gdk_pixbuf_get_colorspace (pixbuf) != GDK_COLORSPACE_RGB) {
            NSLog(@"Unsupported colorspace (must be RGB)");
            [self release];
            return nil;
        }
        if (gdk_pixbuf_get_bits_per_sample (pixbuf) != 8) {
            NSLog(@"Unsupported bits per sample (must be 8)");
            [self release];
            return nil;
        }
        if (gdk_pixbuf_get_has_alpha (pixbuf)) {
            if (gdk_pixbuf_get_n_channels (pixbuf) != 4) {
                NSLog(@"Unsupported bits per sample (must be 4 for an image with alpha)");
                [self release];
                return nil;
            }
            format = CAIRO_FORMAT_ARGB32;
        } else {
            if (gdk_pixbuf_get_n_channels (pixbuf) != 3) {
                NSLog(@"Unsupported bits per sample (must be 3 for an image without alpha)");
                [self release];
                return nil;
            }
            format = CAIRO_FORMAT_RGB24;
        }

        cairo_surface_t *surface = cairo_image_surface_create_for_data(
                gdk_pixbuf_get_pixels(pixbuf),
                format,
                gdk_pixbuf_get_width(pixbuf),
                gdk_pixbuf_get_height(pixbuf),
                gdk_pixbuf_get_rowstride(pixbuf));
        context = cairo_create (surface);
        cairo_surface_destroy (surface);
    }

    return self;
}

- (cairo_t*) cairoContext {
    return context;
}

- (void) applyTransform:(Transformer*)transformer {
    NSPoint origin = [transformer toScreen:NSZeroPoint];
    cairo_translate (context, origin.x, origin.y);
    NSPoint scale = [transformer toScreen:NSMakePoint (1.0f, 1.0f)];
    scale.x -= origin.x;
    scale.y -= origin.y;
    cairo_scale (context, scale.x, scale.y);
}

- (void) saveState {
    cairo_save (context);
}

- (void) restoreState {
    cairo_restore (context);
}

- (NSRect) clipBoundingBox {
    double clipx1, clipx2, clipy1, clipy2;
    cairo_clip_extents (context, &clipx1, &clipy1, &clipx2, &clipy2);
    return NSMakeRect (clipx1, clipy1, clipx2-clipx1, clipy2-clipy1);
}

- (BOOL) strokeIncludesPoint:(NSPoint)p {
    return cairo_in_stroke (context, p.x, p.y);
}

- (BOOL) fillIncludesPoint:(NSPoint)p {
    return cairo_in_fill (context, p.x, p.y);
}

- (id<TextLayout>) layoutText:(NSString*)text withSize:(CGFloat)fontSize {
    PangoTextLayout *layout = [PangoTextLayout layoutForContext:context withFontSize:fontSize];
    [layout setText:text];
    return layout;
}

- (void) setAntialiasMode:(AntialiasMode)mode {
    if (mode == AntialiasDisabled) {
        cairo_set_antialias (context, CAIRO_ANTIALIAS_NONE);
    } else {
        cairo_set_antialias (context, CAIRO_ANTIALIAS_DEFAULT);
    }
}

- (void) setLineWidth:(CGFloat)width {
    cairo_set_line_width (context, width);
}

- (void) setLineDash:(CGFloat)dashLength {
    if (dashLength <= 0.0) {
        cairo_set_dash (context, NULL, 0, 0);
    } else {
        double dashes[] = { dashLength };
        cairo_set_dash (context, dashes, 1, 0);
    }
}

// paths
- (void) startPath {
    cairo_new_path (context);
}

- (void) closeSubPath {
    cairo_close_path (context);
}

- (void) moveTo:(NSPoint)p {
    cairo_move_to(context, p.x, p.y);
}

- (void) curveTo:(NSPoint)end withCp1:(NSPoint)cp1 andCp2:(NSPoint)cp2 {
    cairo_curve_to (context, cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
}

- (void) lineTo:(NSPoint)end {
    cairo_line_to (context, end.x, end.y);
}

- (void) rect:(NSRect)rect {
    cairo_rectangle (context, rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
}

- (void) circleAt:(NSPoint)c withRadius:(CGFloat)r {
    cairo_new_sub_path (context);
    cairo_arc (context, c.x, c.y, r, 0, 2 * M_PI);
}

- (void) strokePathWithColor:(RColor)color {
    cairo_set_source_rcolor (context, color);
    cairo_stroke (context);
}

- (void) fillPathWithColor:(RColor)color {
    cairo_set_source_rcolor (context, color);
    cairo_fill (context);
}

- (void) strokePathWithColor:(RColor)scolor
            andFillWithColor:(RColor)fcolor {
    cairo_set_source_rcolor (context, fcolor);
    cairo_fill_preserve (context);
    cairo_set_source_rcolor (context, scolor);
    cairo_stroke (context);
}

- (void) strokePathWithColor:(RColor)scolor
            andFillWithColor:(RColor)fcolor
                  usingAlpha:(CGFloat)alpha {
    cairo_push_group (context);
    cairo_set_source_rcolor (context, fcolor);
    cairo_fill_preserve (context);
    cairo_set_source_rcolor (context, scolor);
    cairo_stroke (context);
    cairo_pop_group_to_source (context);
    cairo_paint_with_alpha (context, alpha);
}

- (void) clipToPath {
    cairo_clip (context);
}

- (void) paintWithColor:(RColor)color {
    cairo_set_source_rcolor (context, color);
    cairo_paint (context);
}

- (void) clearSurface {
    cairo_operator_t old_op = cairo_get_operator (context);

    cairo_set_operator (context, CAIRO_OPERATOR_SOURCE);
    cairo_set_source_rgba (context, 0.0, 0.0, 0.0, 0.0);
    cairo_paint (context);

    cairo_set_operator (context, old_op);
}

- (void) dealloc {
    if (context) {
        cairo_destroy (context);
    }

    [super dealloc];
}

@end

// vim:ft=objc:ts=8:et:sts=4:sw=4
