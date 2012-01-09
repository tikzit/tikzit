//
//  color.m
//  TikZiT
//  
//  Copyright 2010 Aleks Kissinger. All rights reserved.
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
#import "test/test.h"
#import "ColorRGB.h"

void testColor() {
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	startTestBlock(@"color");
	
	ColorRGB *red = [ColorRGB colorWithRed:255 green:0 blue:0];
	ColorRGB *lime = [ColorRGB colorWithRed:0 green:255 blue:0];
	ColorRGB *green = [ColorRGB colorWithRed:0 green:128 blue:0];
	TEST(@"Recognised red",
		 [red name] != nil &&
		 [[red name] isEqualToString:@"Red"]);
	TEST(@"Recognised lime",
		 [lime name] != nil &&
		 [[lime name] isEqualToString:@"Lime"]);
	TEST(@"Recognised green",
		 [green name] != nil &&
		 [[green name] isEqualToString:@"Green"]);
	
	ColorRGB *floatRed = [ColorRGB colorWithFloatRed:1.0f green:0.0f blue:0.0f];
	ColorRGB *floatLime = [ColorRGB colorWithFloatRed:0.0f green:1.0f blue:0.0f];
	ColorRGB *floatGreen = [ColorRGB colorWithFloatRed:0.0f green:0.5f blue:0.0f];
	
	TEST(@"Float red equal to int red", [floatRed isEqual:red]);
	TEST(@"Float lime equal to int lime", [floatLime isEqual:lime]);
	TEST(@"Float green equal to int green", [floatGreen isEqual:green]);
	
	TEST(@"Recognised float red",
		 [floatRed name] != nil &&
		 [[floatRed name] isEqualToString:@"Red"]);
	
	TEST(@"Recognised float lime",
		 [floatLime name] != nil &&
		 [[floatLime name] isEqualToString:@"Lime"]);
	
	TEST(@"Recognised float green",
		 [floatGreen name] != nil &&
		 [[floatGreen name] isEqualToString:@"Green"]);
	
	[floatRed setRedFloat:0.99f];
	TEST(@"Nudged red, not recognised now", [floatRed name] == nil);
	[floatRed setToClosestHashed];
	TEST(@"Set to closest hashed, reconised again",
		 [floatRed name] != nil &&
		 [[floatRed name] isEqualToString:@"Red"]);
	
	TEST(@"Red has correct hex (ff0000)", [[red hexName] isEqualToString:@"hexcolor0xff0000"]);
	TEST(@"Lime has correct hex (00ff00)", [[lime hexName] isEqualToString:@"hexcolor0x00ff00"]);
	TEST(@"Green has correct hex (008000)", [[green hexName] isEqualToString:@"hexcolor0x008000"]);
	
	endTestBlock(@"color");
	[pool drain];
}