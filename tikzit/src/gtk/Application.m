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

#import "Application.h"

#import "Configuration.h"
#import "PreambleEditor.h"
#ifdef HAVE_POPPLER
#import "Preambles.h"
#import "Preambles+Storage.h"
#import "PreviewWindow.h"
#endif
#ifdef HAVE_POPPLER
#import "SettingsDialog.h"
#endif
#import "Shape.h"
#import "StyleManager.h"
#import "StyleManager+Storage.h"
#import "SupportDir.h"
#import "TikzDocument.h"
#import "Window.h"

#import "BoundingBoxTool.h"
#import "CreateNodeTool.h"
#import "CreateEdgeTool.h"
#import "HandTool.h"
#import "SelectTool.h"

// used for args to g_mkdir_with_parents
#import "stat.h"

Application* app = nil;

@interface Application (Notifications)
- (void) windowClosed:(NSNotification*)notification;
@end

@implementation Application

@synthesize mainConfiguration=configFile;
@synthesize styleManager, preambles;
@synthesize lastOpenFolder, lastSaveAsFolder;
@synthesize tools;

+ (Application*) app {
    if (app == nil) {
        [[[self alloc] init] release];
    }
    return app;
}

- (id) _initCommon {
    if (app != nil) {
        [self release];
        self = app;
        return app;
    }
    self = [super init];

    if (self) {
        NSError *error = nil;
        configFile = [[Configuration alloc] initWithName:@"tikzit" loadError:&error];
        if (error != nil) {
            logError (error, @"WARNING: Failed to load configuration");
        }

        styleManager = [[StyleManager alloc] init];
        [styleManager loadStylesUsingConfigurationName:@"styles"]; // FIXME: error message?

#ifdef HAVE_POPPLER
        NSString *preamblesDir = [[SupportDir userSupportDir] stringByAppendingPathComponent:@"preambles"];
        preambles = [[Preambles alloc] initFromDirectory:preamblesDir]; // FIXME: error message?
        [preambles setStyleManager:styleManager];
        NSString *selectedPreamble = [configFile stringEntry:@"selectedPreamble" inGroup:@"Preambles"];
        if (selectedPreamble != nil) {
            [preambles setSelectedPreambleName:selectedPreamble];
        }
#endif

        lastOpenFolder = [[configFile stringEntry:@"lastOpenFolder" inGroup:@"Paths"] retain];
        if (lastOpenFolder == nil)
            lastOpenFolder = [[configFile stringEntry:@"lastFolder" inGroup:@"Paths"] retain];
        lastSaveAsFolder = [[configFile stringEntry:@"lastSaveAsFolder" inGroup:@"Paths"] retain];
        if (lastSaveAsFolder == nil)
            lastSaveAsFolder = [[configFile stringEntry:@"lastFolder" inGroup:@"Paths"] retain];

        openWindows = [[NSMutableArray alloc] init];

        tools = [[NSArray alloc] initWithObjects:
            [SelectTool tool],
            [CreateNodeTool tool],
            [CreateEdgeTool tool],
            [BoundingBoxTool tool],
            [HandTool tool],
            nil];
        activeTool = [[tools objectAtIndex:0] retain];

        // FIXME: toolboxes

        app = [self retain];
    }

    return self;
}

- (id) init {
    self = [self _initCommon];

    if (self) {
        [self newWindow];
    }

    return self;
}

- (id) initWithFiles:(NSArray*)files {
    self = [self _initCommon];

    if (self) {
        int fileOpenCount = 0;
        for (NSString *file in files) {
            NSError *error = nil;
            TikzDocument *doc = [TikzDocument documentFromFile:file styleManager:styleManager error:&error];
            if (doc != nil) {
                [self newWindowWithDocument:doc];
                ++fileOpenCount;
            } else {
                logError(error, @"WARNING: failed to open file");
            }
        }
        if (fileOpenCount == 0) {
            [self newWindow];
        }
    }

    return self;
}

- (void) dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];

    [configFile release];
    [styleManager release];
    [preambles release];
    [lastOpenFolder release];
    [lastSaveAsFolder release];
    [preambleWindow release];
    [previewWindow release];
    [settingsDialog release];
    [openWindows release];
    [tools release];
    [activeTool release];

    [super dealloc];
}

- (id<Tool>) activeTool { return activeTool; }
- (void) setActiveTool:(id<Tool>)tool {
    for (Window* window in openWindows) {
        [window setActiveTool:tool];
    }
}

- (void) _addWindow:(Window*)window {
    [window setActiveTool:activeTool];
    [openWindows addObject:window];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(windowClosed:)
                                                 name:@"WindowClosed"
                                               object:window];
    // FIXME: focus?
}

- (void) newWindow {
    [self _addWindow:[Window window]];
}

- (void) newWindowWithDocument:(TikzDocument*)doc {
    [self _addWindow:[Window windowWithDocument:doc]];
}

- (void) quit {
    NSMutableArray *unsavedDocs = [NSMutableArray arrayWithCapacity:[openWindows count]];
    for (Window *window in openWindows) {
        TikzDocument *doc = [window document];
        if ([doc hasUnsavedChanges]) {
            [unsavedDocs addObject:doc];
        }
    }
    if ([unsavedDocs count] > 0) {
        // FIXME: show a dialog
        return;
    }
    gtk_main_quit();
}

- (void) showPreamblesEditor {
#ifdef HAVE_POPPLER
    if (preambleWindow == nil) {
        preambleWindow = [[PreambleEditor alloc] initWithPreambles:preambles];
        //[preambleWindow setParentWindow:mainWindow];
    }
    [preambleWindow show];
#endif
}

- (void) showPreviewForDocument:(TikzDocument*)doc {
#ifdef HAVE_POPPLER
    if (previewWindow == nil) {
        previewWindow = [[PreviewWindow alloc] initWithPreambles:preambles config:configFile];
        //[previewWindow setParentWindow:mainWindow];
        [previewWindow setDocument:doc];
    }
    [previewWindow show];
#endif
}

- (void) showSettingsDialog {
#ifdef HAVE_POPPLER
    if (settingsDialog == nil) {
        settingsDialog = [[SettingsDialog alloc] initWithConfiguration:configFile];
        //[settingsDialog setParentWindow:mainWindow];
    }
    [settingsDialog show];
#endif
}

- (Configuration*) mainConfiguration {
    return configFile;
}

- (void) saveConfiguration {
    NSError *error = nil;

#ifdef HAVE_POPPLER
    if (preambles != nil) {
        NSString *preamblesDir = [[SupportDir userSupportDir] stringByAppendingPathComponent:@"preambles"];
        // NSFileManager is slightly dodgy on Windows
	g_mkdir_with_parents ([preamblesDir UTF8String], S_IRUSR | S_IWUSR | S_IXUSR);
        [preambles storeToDirectory:preamblesDir];
        [configFile setStringEntry:@"selectedPreamble" inGroup:@"Preambles" value:[preambles selectedPreambleName]];
    }
#endif

    [styleManager saveStylesUsingConfigurationName:@"styles"];

    if (lastOpenFolder != nil) {
        [configFile setStringEntry:@"lastOpenFolder" inGroup:@"Paths" value:lastOpenFolder];
    }
    if (lastSaveAsFolder != nil) {
        [configFile setStringEntry:@"lastSaveAsFolder" inGroup:@"Paths" value:lastSaveAsFolder];
    }

    if (![configFile writeToStoreWithError:&error]) {
        logError (error, @"Could not write config file");
    }
}

@end

@implementation Application (Notifications)
- (void) windowClosed:(NSNotification*)notification {
    Window *window = [notification object];
    [openWindows removeObjectIdenticalTo:window];
    [[NSNotificationCenter defaultCenter] removeObserver:self
                                                    name:nil
                                                  object:window];
    if ([openWindows count] == 0) {
        gtk_main_quit();
    }
}
@end

// vim:ft=objc:ts=8:et:sts=4:sw=4:foldmethod=marker
