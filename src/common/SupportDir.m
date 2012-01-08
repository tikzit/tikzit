//
//  SupportDir.m
//  TikZiT
//  
//  Copyright 2011 Aleks Kissinger. All rights reserved.
//  
//  
//  This file is part of TikZiT.
//  
//  TikZiT is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//  
//  TikZiT is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  
//  You should have received a copy of the GNU General Public License
//  along with TikZiT.  If not, see <http://www.gnu.org/licenses/>.
//  

#import "SupportDir.h"

#ifndef __APPLE__
#import <glib.h>
#endif

@implementation SupportDir

+ (NSString*)userSupportDir {
#ifdef __APPLE__
	return [[NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory,NSUserDomainMask,YES)
			objectAtIndex:0] stringByAppendingPathComponent:@"TikZiT"];
#else
	return [NSString stringWithFormat:@"%s/tikzit", g_get_user_config_dir ()];
#endif
}

+ (NSString*)systemSupportDir {
#ifdef __APPLE__
	return [[NSBundle mainBundle] resourcePath];
#else
	return @TIKZITSHAREDIR; // TODO: improve + support windows
#endif
}

+ (void)createUserSupportDir {
#ifdef __APPLE__
	NSFileManager *fileManager = [NSFileManager defaultManager];
	NSError *error = nil;
	[fileManager createDirectoryAtPath:[SupportDir userSupportDir]
	       withIntermediateDirectories:YES
	                        attributes:nil
	                             error:NULL];
#else
	// NSFileManager is slightly dodgy on Windows
	g_mkdir_with_parents ([[SupportDir userSupportDir] UTF8String], 700);
#endif
}

@end

// vi:ft=objc:ts=4:noet:sts=4:sw=4
