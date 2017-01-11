/*
 * Copyright 2013  Alex Merry <alex.merry@kdemail.net>
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

#import <Foundation/Foundation.h>
#import "NSString+Util.h"
#import "NSError+Tikzit.h"

@implementation NSString (Util)
+ (NSString*) stringWithContentsOfFile:(NSString*)path
								 error:(NSError**)error
{
	return [[[self alloc] initWithContentsOfFile:path error:error] autorelease];
}
- (id) initWithContentsOfFile:(NSString*)path
						error:(NSError**)error
{
	// Fun fact: on GNUstep, at least,
	// [stringWithContentsOfFile:usedEncoding:error:] only
	// sets error objects if the decoding fails, not if file
	// access fails.
	// Fun fact 2: on GNUstep, trying to read a directory using
	// [stringWithContentsOfFile:] causes an out-of-memory error;
	// hence we do these checks *before* trying to read the file.
	NSFileManager *fm = [NSFileManager defaultManager];
	BOOL isDir = NO;
	NSString *msg = nil;
	if (![fm fileExistsAtPath:path isDirectory:&isDir]) {
		msg = [NSString stringWithFormat:@"\"%@\" does not exist", path];
	} else if (isDir) {
		msg = [NSString stringWithFormat:@"\"%@\" is a directory", path];
	} else if (![fm isReadableFileAtPath:path]) {
		msg = [NSString stringWithFormat:@"\"%@\" is not readable", path];
	}
	if (msg != nil) {
		if (error) {
			*error = [NSError errorWithMessage:msg
										  code:TZ_ERR_IO];
		}
		return nil;
	}
	self = [self initWithContentsOfFile:path];
	if (self == nil) {
		if (error) {
			*error = [NSError errorWithMessage:@"unknown error"
										  code:TZ_ERR_IO];
		}
	}
	return self;
}
@end

// vi:ft=objc:noet:ts=4:sts=4:sw=4
