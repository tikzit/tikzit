//
//  UpdatePreferenceController.h
//  TikZiT
//
//  Copyright (c) 2013 Aleks Kissinger. All rights reserved.
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

#import "UpdatePreferenceController.h"

@interface UpdatePreferenceController ()

@end

@implementation UpdatePreferenceController

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        sharedUpdater = [SUUpdater sharedUpdater];
    }
    return self;
}

- (IBAction)checkForUpdates:(id)sender{
    [sharedUpdater checkForUpdates:sender];
}

- (NSDate*)getLastUpdate{
    return [sharedUpdater lastUpdateCheckDate];
}

@end
