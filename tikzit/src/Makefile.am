if WINDOWS
sharedir = ../
else
sharedir = @datarootdir@/tikzit
endif

AM_OBJCFLAGS = @FOUNDATION_OBJCFLAGS@ \
               @GTK_CFLAGS@ \
                -I common \
                -I gtk \
                -DTIKZITSHAREDIR=\"$(sharedir)\" \
                -std=c99 \
                -D_GNU_SOURCE
LIBS = @FOUNDATION_LIBS@ \
       @GTK_LIBS@
AM_YFLAGS = -d
PARSERFILES = common/tikzlexer.m common/tikzparser.m common/tikzparser.h
ICONFILES = ../draw-ellipse.png \
	    ../draw-path.png \
	    ../select-rectangular.png \
	    ../transform-crop-and-resize.png \
	    ../transform-move.png
EDGEDECFILES = ../AH_*.png ../ED_*.png

bin_PROGRAMS = tikzit
BUILT_SOURCES = $(PARSERFILES)
tikzit_SOURCES = gtk/Application.m \
                 gtk/BoundingBoxTool.m \
                 gtk/CairoRenderContext.m \
                 gtk/ColorRGB+IntegerListStorage.m \
                 gtk/ColorRGB+Gtk.m \
                 gtk/Configuration.m \
                 gtk/CreateEdgeTool.m \
                 gtk/CreateNodeTool.m \
                 gtk/Edge+Render.m \
                 gtk/EdgeStyle+Gtk.m \
                 gtk/EdgeStyle+Storage.m \
                 gtk/EdgeStyleEditor.m \
                 gtk/EdgeStyleSelector.m \
                 gtk/EdgeStylesModel.m \
                 gtk/EdgeStylesPalette.m \
                 gtk/FileChooserDialog.m \
                 gtk/HandTool.m \
                 gtk/GraphEditorPanel.m \
                 gtk/GraphRenderer.m \
                 gtk/Menu.m \
                 gtk/Node+Render.m \
                 gtk/NodeStyle+Gtk.m \
                 gtk/NodeStyle+Storage.m \
                 gtk/NodeStyleEditor.m \
                 gtk/NodeStylesModel.m \
                 gtk/NodeStyleSelector.m \
                 gtk/NodeStylesPalette.m \
                 gtk/NSError+Glib.m \
                 gtk/NSFileManager+Glib.m \
                 gtk/NSString+Glib.m \
                 gtk/PropertiesWindow.m \
                 gtk/PropertyListEditor.m \
                 gtk/RecentManager.m \
                 gtk/SelectTool.m \
                 gtk/Shape+Render.m \
                 gtk/StyleManager+Storage.m \
                 gtk/TikzDocument.m \
                 gtk/ToolBox.m \
                 gtk/WidgetSurface.m \
                 gtk/Window.m \
                 gtk/cairo_helpers.m \
                 gtk/clipboard.m \
                 gtk/gtkhelpers.m \
                 gtk/logo.m \
                 gtk/mkdtemp.m \
                 gtk/main.m \
                 gtk/tzstockitems.m \
                 gtk/tztoolpalette.m \
                 common/CircleShape.m \
                 common/ColorRGB.m \
                 common/DiamondShape.m \
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
                 common/Preambles.m \
                 gtk/PreambleEditor.m \
                 gtk/Preambles+Storage.m \
                 gtk/PreviewRenderer.m \
                 gtk/PreviewWindow.m \
                 gtk/SettingsDialog.m
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

gtk/icondata.m: $(ICONFILES)
	$(AM_V_GEN)gdk-pixbuf-csource --struct --static --raw --build-list \
		draw_ellipse ../draw-ellipse.png \
		draw_path ../draw-path.png \
		select_rectangular ../select-rectangular.png \
		transform_crop_and_resize ../transform-crop-and-resize.png \
		transform_move ../transform-move.png \
		> $@

gtk/logodata.m: ../share/icons/hicolor/*/apps/tikzit.png
	$(AM_V_GEN)gdk-pixbuf-csource --struct --static --raw --build-list \
		logo16 ../share/icons/hicolor/16x16/apps/tikzit.png \
		logo24 ../share/icons/hicolor/24x24/apps/tikzit.png \
		logo32 ../share/icons/hicolor/32x32/apps/tikzit.png \
		logo48 ../share/icons/hicolor/48x48/apps/tikzit.png \
		logo64 ../share/icons/hicolor/64x64/apps/tikzit.png \
		logo128 ../share/icons/hicolor/128x128/apps/tikzit.png \
		> $@

gtk/edgedecdata.m: $(EDGEDECFILES)
	$(AM_V_GEN)gdk-pixbuf-csource --struct --static --raw --build-list \
		AH_none_pixdata ../AH_none.png \
		AH_latex_head_pixdata ../AH_latex_head.png \
		AH_latex_tail_pixdata ../AH_latex_tail.png \
		AH_plain_head_pixdata ../AH_plain_head.png \
		AH_plain_tail_pixdata ../AH_plain_tail.png \
		ED_none_pixdata ../ED_none.png \
		ED_arrow_pixdata ../ED_arrow.png \
		ED_tick_pixdata ../ED_tick.png \
		> $@

gtk/Menu.m: gtk/icondata.m
gtk/logo.m: gtk/logodata.m
gtk/EdgeStyleEditor.m: gtk/edgedecdata.m

EXTRA_DIST = gtk/*.h common/*.h \
	     $(PARSERFILES) common/tikzlexer.lm common/tikzparser.ym \
	     $(ICONFILES) gtk/icondata.m \
	     gtk/logodata.m \
	     $(EDGEDECFILES) gtk/edgedecdata.m \
	     tikzit.rc ../tikzit.ico
MAINTAINERCLEANFILES = $(PARSERFILES) gtk/icondata.m gtk/logodata.m gtk/edgedecdata.m
