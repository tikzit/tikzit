if WINDOWS
sharedir = ../
else
sharedir = @datarootdir@/tikzit
endif

AM_OBJCFLAGS = @GNUSTEPOBJCFLAGS@ \
               @GTK_CFLAGS@ \
               @GDK_PIXBUF_CFLAGS@ \
               @POPPLER_CFLAGS@ \
                -I common \
                -I linux \
                -DTIKZITSHAREDIR=\"$(sharedir)\" \
                -std=c99 \
                -D_GNU_SOURCE
LIBS = @GNUSTEPLIBS@ \
       @GTK_LIBS@ \
       @GDK_PIXBUF_LIBS@ \
       @POPPLER_LIBS@
AM_YFLAGS = -d
PARSERFILES = common/tikzlexer.m common/tikzparser.m common/tikzparser.h

bin_PROGRAMS = tikzit
BUILT_SOURCES = $(PARSERFILES)
tikzit_SOURCES = linux/CairoRenderContext.m \
                 linux/ColorRGB+IntegerListStorage.m \
                 linux/ColorRGB+Gtk.m \
                 linux/Configuration.m \
                 linux/Edge+Render.m \
                 linux/EdgeStyle+Storage.m \
                 linux/FileChooserDialog.m \
                 linux/GraphInputHandler.m \
                 linux/GraphRenderer.m \
                 linux/MainWindow.m \
                 linux/Menu.m \
                 linux/Node+Render.m \
                 linux/NodeStyle+Gtk.m \
                 linux/NodeStyle+Storage.m \
                 linux/NodeStyleEditor.m \
                 linux/NodeStyleSelector.m \
                 linux/NodeStylesPalette.m \
                 linux/NSError+Glib.m \
                 linux/NSFileManager+Glib.m \
                 linux/NSString+Glib.m \
                 linux/PreambleEditor.m \
                 linux/Preambles+Storage.m \
                 linux/PropertyPane.m \
                 linux/PropertyListEditor.m \
                 linux/RecentManager.m \
                 linux/Shape+Render.m \
                 linux/StyleManager+Storage.m \
                 linux/TikzDocument.m \
                 linux/WidgetSurface.m \
                 linux/cairo_helpers.m \
                 linux/clipboard.m \
                 linux/gtkhelpers.m \
                 linux/logo.m \
                 linux/mkdtemp.m \
                 linux/main.m \
                 common/BasicMapTable.m \
                 common/CircleShape.m \
                 common/ColorRGB.m \
                 common/Edge.m \
                 common/EdgeStyle.m \
                 common/GraphChange.m \
                 common/GraphElementData.m \
                 common/Graph.m \
                 common/Grid.m \
                 common/Node.m \
                 common/NodeStyle.m \
                 common/NSError+Tikzit.m \
                 common/NSFileManager+Utils.m \
                 common/NSString+LatexConstants.m \
                 common/PickSupport.m \
                 common/Preambles.m \
                 common/PropertyHolder.m \
                 common/GraphElementProperty.m \
                 common/RColor.m \
                 common/RectangleShape.m \
                 common/RegularPolyShape.m \
                 common/Shape.m \
                 common/StyleManager.m \
                 common/SupportDir.m \
                 common/TikzGraphAssembler.m \
                 common/TikzShape.m \
                 common/Transformer.m \
                 common/tikzparser.m \
                 common/tikzlexer.m \
                 common/util.m

if HAVE_POPPLER
tikzit_SOURCES += \
                 linux/PreviewRenderer.m \
                 linux/PreviewWindow.m
endif

if WINDOWS
tikzit.res: tikzit.rc
	$(AM_V_GEN)windres $^ -O coff -o $@

tikzit_LDADD = tikzit.res
CLEANFILES = tikzit.res
endif

common/tikzlexer.m: common/tikzlexer.lm
	$(AM_V_GEN)$(LEX) -o $@ $^

common/tikzparser.m: common/tikzparser.ym
	$(AM_V_GEN)$(YACC) --defines=common/tikzparser.h --output=$@ $^

common/tikzparser.h: common/tikzparser.m

linux/icondata.m: ../draw-ellipse.png ../draw-path.png ../select-rectangular.png ../transform-crop-and-resize.png ../transform-move.png
	$(AM_V_GEN)gdk-pixbuf-csource --struct --static --raw --build-list \
		draw_ellipse ../draw-ellipse.png \
		draw_path ../draw-path.png \
		select_rectangular ../select-rectangular.png \
		transform_crop_and_resize ../transform-crop-and-resize.png \
		transform_move ../transform-move.png \
		> $@

linux/logodata.m: ../share/icons/hicolor/*/apps/tikzit.png
	$(AM_V_GEN)gdk-pixbuf-csource --struct --static --raw --build-list \
		logo16 ../share/icons/hicolor/16x16/apps/tikzit.png \
		logo24 ../share/icons/hicolor/24x24/apps/tikzit.png \
		logo32 ../share/icons/hicolor/32x32/apps/tikzit.png \
		logo48 ../share/icons/hicolor/48x48/apps/tikzit.png \
		logo64 ../share/icons/hicolor/64x64/apps/tikzit.png \
		logo128 ../share/icons/hicolor/128x128/apps/tikzit.png \
		> $@

linux/Menu.m: linux/icondata.m
linux/logo.m: linux/logodata.m

EXTRA_DIST = linux/*.h common/*.h $(PARSERFILES) common/tikzlexer.lm common/tikzparser.ym
MAINTAINERCLEANFILES = $(PARSERFILES)
