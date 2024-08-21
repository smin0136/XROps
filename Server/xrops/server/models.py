import os
import torch
import random
import numpy as np
import pandas as pd
import skimage.io as io
import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models
import torchvision.transforms as tfms
from skimage.transform import resize

from config import settings
from image import change_img_to_nparray
from deepzoom import _get_or_create_path, read_tile_as_npy, merge_upper_level_tiles
from data import get_deepzoom_descriptor_by_path, DeepZoomImageDescriptor

# deploy
import deploy_scripts.config as config
import deploy_scripts.data_loader as data_loader
import deploy_scripts.init_experiment as init_exp
from deploy_scripts.dual_loader import Test_ds
from deploy_scripts.dual_inference import Inference

print(torch.cuda.is_available())
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(device)

print(torch.multiprocessing.get_start_method())


def cancer_detection_model(descriptor:DeepZoomImageDescriptor, tile_dir, tile_tissue_dir, saved_file_tile_dir,
    model_name='efficientnet_b0', min_col=0, max_col=0, min_row=0, max_row=0, cur_level=0, all_tiles=True, 
    tile_size=256, skip=False, highest_level_all=False):

    #########################################################

    model_name = 'efficientnet_b0'
    num_classes = 2 

    if model_name == 'efficientnet_b0':
        net = models.efficientnet_b0(pretrained= True)
        net.classifier = nn.Linear(1280, num_classes, bias=True)
    elif model_name == 'resnet18':
        net = models.resnet18(pretrained=True)
        net.fc = nn.Linear(512, num_classes, bias=True)

    checkpoint_path = os.path.join(settings.repo_root_dir, 'models/checkpoints/pretrained_model.pth')
    

    loaded = torch.load(checkpoint_path, map_location=device)
    net.load_state_dict(loaded)

    #########################################################
    means = [198.32048249889903, 146.2154971299728, 181.516727757176]
    stds  = [29.906352942372795, 34.237381144432476, 25.718758740829585]
    #########################################################

    net.to(device)
    net.eval()

    if highest_level_all:
        cur_level = descriptor.num_levels - 1

    with torch.no_grad():
        for level in range(descriptor._num_levels):
            tile_level_dir = os.path.join(saved_file_tile_dir, str(level))
            _get_or_create_path(tile_level_dir)

            if all_tiles or ((not all_tiles) and level == cur_level):
            
                col_start, col_end, row_start, row_end = (0, 0, 0, 0)

                if all_tiles:
                    col_end, row_end = descriptor.get_num_tiles(level)
                    col_end = col_end - 1
                    row_end = row_end - 1
                else:
                    col_start = min_col if min_col > 0 else 0 
                    row_start = min_row if min_row > 0 else 0 

                    if highest_level_all:
                        max_col_num, max_row_num = descriptor.get_num_tiles(level)
                        col_end = max_col_num - 1
                        row_end = max_row_num - 1
                    else:
                        max_col_num, max_row_num = descriptor.get_num_tiles(level)
                        col_end = max_col if max_col < max_col_num else max_col_num - 1
                        row_end = max_row if max_row < max_row_num else max_row_num - 1


                print(f"col_start: {col_start}, col_end: {col_end}, row_start: {row_start}, row_end: {row_end} level: {level}")
    
                for col in range(col_start, col_end + 1):
                    for row in range(row_start, row_end + 1):
                        saved_tile_path = os.path.join(saved_file_tile_dir, str(level), f"{col}_{row}.png")
                        if os.path.exists(saved_tile_path) and skip:
                            continue

                        tile_path = os.path.join(tile_dir, str(level), '{}_{}.png'.format(col, row))
                        tile_npy = read_tile_as_npy(tile_path)

                        tile_tissue_path = os.path.join(tile_tissue_dir, str(level), '{}_{}.png'.format(col, row))
                        tile_tissue_npy = read_tile_as_npy(tile_tissue_path)

                        padded_tile = tile_npy
                        padded_tile_tissue = tile_tissue_npy

                        tissue_area = np.count_nonzero(padded_tile_tissue) / (tile_size * tile_size) * 100
                        
                        emp = np.zeros([tile_npy.shape[0], tile_npy.shape[1],1])

                        if tissue_area > 80:
                            do_normalize = tfms.Normalize(means, stds)
                            patch = do_normalize(torch.from_numpy(padded_tile.transpose((2, 0, 1))).float())
                            patch = torch.unsqueeze(patch, 0).to(device)
                            pred_label = net(patch).cpu().detach().numpy()
                            # print("test")

                            pred_label_activated = torch.sigmoid(torch.from_numpy(pred_label)).numpy()

                            emp.fill(np.argmax(pred_label_activated))

                        io.imsave(saved_tile_path, emp.astype(np.uint8)*255, check_contrast=False)
                        # io.imsave(saved_tile_path, (emp * 255).astype(np.uint8), check_contrast=False)


def cancer_detection_pyramid(descriptor:DeepZoomImageDescriptor, tile_dir, tile_tissue_dir, saved_file_tile_dir,
    model_name='efficientnet_b0', min_col=0, max_col=0, min_row=0, max_row=0, cur_level=0, 
    top_level=0, tile_size=256, skip=False):

    #########################################################

    model_name = 'efficientnet_b0'
    num_classes = 2 

    if model_name == 'efficientnet_b0':
        net = models.efficientnet_b0(pretrained= True)
        net.classifier = nn.Linear(1280, num_classes, bias=True)
    elif model_name == 'resnet18':
        net = models.resnet18(pretrained=True)
        net.fc = nn.Linear(512, num_classes, bias=True)

    checkpoint_path = os.path.join(settings.repo_root_dir, 'models/checkpoints/pretrained_model.pth')
    

    loaded = torch.load(checkpoint_path, map_location=device)
    net.load_state_dict(loaded)

    #########################################################
    means = [198.32048249889903, 146.2154971299728, 181.516727757176]
    stds  = [29.906352942372795, 34.237381144432476, 25.718758740829585]
    #########################################################

    net.to(device)
    net.eval()

    level = cur_level
    tile_overlap = descriptor.tile_overlap
    tile_size = descriptor.tile_size

    with torch.no_grad():
        # if skip:
        #     while level > top_level:
        #         min_col = min_col if min_col > 0 else 0
        #         min_row = min_row if min_row > 0 else 0

        #         max_col_num, max_row_num = descriptor.get_num_tiles(level)
        #         max_col = max_col if max_col < max_col_num else max_col_num - 1
        #         max_row = max_row if max_row < max_row_num else max_row_num - 1

        #         min_col = (min_col + 1) // 2
        #         min_row = (min_row + 1) // 2
        #         max_col = (max_col + 1) // 2
        #         max_row = (max_row + 1) // 2
        #         level = level - 1

        #     for col in range(min_col, max_col + 1):
        #         for row in range(min_row, max_row + 1):
        #             merge_upper_level_tiles(col, row, level, tile_overlap, descriptor, saved_file_tile_dir, skip)
        # else:
        #     min_col = min_col if min_col > 0 else 0
        #     min_row = min_row if min_row > 0 else 0

        #     max_col_num, max_row_num = descriptor.get_num_tiles(level)
        #     max_col = max_col if max_col < max_col_num else max_col_num - 1
        #     max_row = max_row if max_row < max_row_num else max_row_num - 1

        #     for col in range(min_col, max_col + 1):
        #         for row in range(min_row, max_row + 1):
        #             saved_tile_path = os.path.join(saved_file_tile_dir, str(level), f"{col}_{row}.png")
        #             if os.path.exists(saved_tile_path) and skip:
        #                 continue

        #             tile_path = os.path.join(tile_dir, str(cur_level), '{}_{}.png'.format(col, row))
        #             tile_npy = read_tile_as_npy(tile_path)

        #             tile_tissue_path = os.path.join(tile_tissue_dir, str(cur_level), '{}_{}.png'.format(col, row))
        #             tile_tissue_npy = read_tile_as_npy(tile_tissue_path)

        #             # now_min_x, now_min_y, now_max_x, now_max_y = descriptor.get_tile_bounds(level, col, row)
        #             # tile_npy_width = now_max_x - now_min_x
        #             # tile_npy_height = now_max_y - now_min_y

        #             padded_tile = tile_npy
        #             padded_tile_tissue = tile_tissue_npy

        #             tissue_area = np.count_nonzero(padded_tile_tissue) / (tile_size * tile_size) * 100
                    
        #             emp = np.zeros([tile_npy.shape[0], tile_npy.shape[1],1])
        #             # emp = np.zeros([tile_npy_height, tile_npy_width,1])

        #             if tissue_area > 80:
        #                 do_normalize = tfms.Normalize(means, stds)
        #                 patch = do_normalize(torch.from_numpy(padded_tile.transpose((2, 0, 1))).float())
        #                 patch = torch.unsqueeze(patch, 0).to(device)
        #                 pred_label = net(patch).cpu().detach().numpy()
        #                 # print("test")

        #                 pred_label_activated = torch.sigmoid(torch.from_numpy(pred_label)).numpy()

        #                 emp.fill(np.argmax(pred_label_activated))

        #             io.imsave(saved_tile_path, emp.astype(np.uint8) * 255, check_contrast=False)
        #             # io.imsave(saved_tile_path, (emp * 255).astype(np.uint8), check_contrast=False)


        while level >= top_level:
            print(f"min_col: {min_col} max_col: {max_col} min_row: {min_row} max_row: {max_row} cur_level: {cur_level} top_level: {top_level}")
            tile_level_dir = os.path.join(saved_file_tile_dir, str(level))
            _get_or_create_path(tile_level_dir)

            # # col_start = min_col if min_col > 0 else 0 
            # # row_start = min_row if min_row > 0 else 0

            # col_start = 0 
            # row_start =  0

            # max_col_num, max_row_num = descriptor.get_num_tiles(level)
            # # col_end = max_col if max_col < max_col_num else max_col_num - 1
            # # row_end = max_row if max_row < max_row_num else max_row_num - 1

            # col_end = max_col_num - 1
            # row_end = max_row_num - 1

            min_col_temp = (min_col // (2 ** (level - top_level))) * (2 ** (level - top_level))
            min_row_temp = (min_row // (2 ** (level - top_level))) * (2 ** (level - top_level))

            col_start = min_col_temp if min_col_temp > 0 else 0 
            row_start = min_row_temp if min_row_temp > 0 else 0

            max_col_num, max_row_num = descriptor.get_num_tiles(level)

            max_col_temp = (max_col // (2 ** (level - top_level)) + 1) * (2 ** (level - top_level)) - 1
            max_row_temp = (max_row // (2 ** (level - top_level)) + 1) * (2 ** (level - top_level)) - 1

            col_end = max_col_temp if max_col_temp < max_col_num else max_col_num - 1
            row_end = max_row_temp if max_row_temp < max_row_num else max_row_num - 1


            if level == cur_level:
                for col in range(col_start, col_end + 1):
                    for row in range(row_start, row_end + 1):
                        saved_tile_path = os.path.join(saved_file_tile_dir, str(level), f"{col}_{row}.png")
                        if os.path.exists(saved_tile_path) and skip:
                            continue

                        tile_path = os.path.join(tile_dir, str(cur_level), '{}_{}.png'.format(col, row))
                        tile_npy = read_tile_as_npy(tile_path)

                        tile_tissue_path = os.path.join(tile_tissue_dir, str(cur_level), '{}_{}.png'.format(col, row))
                        tile_tissue_npy = read_tile_as_npy(tile_tissue_path)

                        # now_min_x, now_min_y, now_max_x, now_max_y = descriptor.get_tile_bounds(level, col, row)
                        # tile_npy_width = now_max_x - now_min_x
                        # tile_npy_height = now_max_y - now_min_y

                        padded_tile = tile_npy
                        padded_tile_tissue = tile_tissue_npy

                        tissue_area = np.count_nonzero(padded_tile_tissue) / (tile_size * tile_size) * 100
                        
                        emp = np.zeros([tile_npy.shape[0], tile_npy.shape[1],1])
                        # emp = np.zeros([tile_npy_height, tile_npy_width,1])

                        if tissue_area > 80:
                            do_normalize = tfms.Normalize(means, stds)
                            patch = do_normalize(torch.from_numpy(padded_tile.transpose((2, 0, 1))).float())
                            patch = torch.unsqueeze(patch, 0).to(device)
                            pred_label = net(patch).cpu().detach().numpy()
                            # print("test")

                            pred_label_activated = torch.sigmoid(torch.from_numpy(pred_label)).numpy()

                            emp.fill(np.argmax(pred_label_activated))

                        io.imsave(saved_tile_path, emp.astype(np.uint8) * 255, check_contrast=False)
                        # io.imsave(saved_tile_path, (emp * 255).astype(np.uint8), check_contrast=False)
            else:
                for col in range(col_start, col_end + 1):
                    for row in range(row_start, row_end + 1):
                        merge_upper_level_tiles(col, row, level, tile_overlap, descriptor, saved_file_tile_dir, skip)


            min_col = min_col // 2
            min_row = min_row // 2
            max_col = max_col // 2
            max_row = max_row // 2
            level = level - 1


    
def fatty_liver_detection_model(descriptor:DeepZoomImageDescriptor, tile_dir, tile_mask_dir, saved_file_tile_dir,
   min_col=0, max_col=0, min_row=0, max_row=0, cur_level=0, all_tiles=True, 
   with_pyramid=False, top_level=0, skip=False, highest_level_all=False):
   
    cfg = config.load_config(tile_dir, tile_mask_dir)
    net_small = init_exp._init_model(cfg.model, cfg.encoder.lower(), cfg.in_channels, cfg.out_channels)
    net_big = init_exp._init_model(cfg.model, cfg.encoder.lower(), cfg.in_channels, cfg.out_channels)

    id_list = [] 

    if not with_pyramid:
        if highest_level_all:
            cur_level = descriptor.num_levels - 1

        thumbnail_level = descriptor.get_thumbnail_level()

        level_list = [thumbnail_level, cur_level]
        
        for level in range(thumbnail_level, descriptor._num_levels):
            tile_level_dir = os.path.join(saved_file_tile_dir, str(level))
            _get_or_create_path(tile_level_dir)

            if all_tiles or ((not all_tiles) and level == cur_level):
            
                col_start, col_end, row_start, row_end = (0, 0, 0, 0)

                if all_tiles:
                    col_end, row_end = descriptor.get_num_tiles(level)
                    col_end = col_end - 1
                    row_end = row_end - 1
                else:
                    col_start = min_col if min_col > 0 else 0 
                    row_start = min_row if min_row > 0 else 0 

                    if highest_level_all:
                        max_col_num, max_row_num = descriptor.get_num_tiles(level)
                        col_end = max_col_num - 1
                        row_end = max_row_num - 1
                    else:
                        max_col_num, max_row_num = descriptor.get_num_tiles(level)
                        col_end = max_col if max_col < max_col_num else max_col_num - 1
                        row_end = max_row if max_row < max_row_num else max_row_num - 1

                for col in range(col_start, col_end + 1):
                    for row in range(row_start, row_end + 1):
                        id_list.append(f"{level}/{col}_{row}")

        
        print("test")

        test_dataset = Test_ds(id_list, cfg.dir_edict, cfg)

        test_data_loader = torch.utils.data.DataLoader(test_dataset, batch_size=1, shuffle=False, num_workers=cfg.num_workers)

        inference = Inference(cfg, net_small, net_big, test_data_loader, saved_file_tile_dir)
        inference.main()
    else:
        level = cur_level
        tile_overlap = descriptor.tile_overlap
        
        while level >= top_level:
            print(f"min_col: {min_col} max_col: {max_col} min_row: {min_row} max_row: {max_row} cur_level: {cur_level} top_level: {top_level}")
            tile_level_dir = os.path.join(saved_file_tile_dir, str(level))
            _get_or_create_path(tile_level_dir)

            # # col_start = min_col if min_col > 0 else 0 
            # # row_start = min_row if min_row > 0 else 0

            # col_start = 0 
            # row_start =  0

            # max_col_num, max_row_num = descriptor.get_num_tiles(level)
            # # col_end = max_col if max_col < max_col_num else max_col_num - 1
            # # row_end = max_row if max_row < max_row_num else max_row_num - 1

            # col_end = max_col_num - 1
            # row_end = max_row_num - 1

            min_col_temp = (min_col // (2 ** (level - top_level))) * (2 ** (level - top_level))
            min_row_temp = (min_row // (2 ** (level - top_level))) * (2 ** (level - top_level))

            col_start = min_col_temp if min_col_temp > 0 else 0 
            row_start = min_row_temp if min_row_temp > 0 else 0

            max_col_num, max_row_num = descriptor.get_num_tiles(level)

            max_col_temp = (max_col // (2 ** (level - top_level)) + 1) * (2 ** (level - top_level)) - 1
            max_row_temp = (max_row // (2 ** (level - top_level)) + 1) * (2 ** (level - top_level)) - 1

            col_end = max_col_temp if max_col_temp < max_col_num else max_col_num - 1
            row_end = max_row_temp if max_row_temp < max_row_num else max_row_num - 1

            if level == cur_level:
                for col in range(col_start, col_end + 1):
                    for row in range(row_start, row_end + 1):
                        saved_tile_path = os.path.join(saved_file_tile_dir, str(level), f"{col}_{row}.png")
                        if os.path.exists(saved_tile_path) and skip:
                            continue

                        id_list.append(f"{level}/{col}_{row}")

                test_dataset = Test_ds(id_list, cfg.dir_edict, cfg)
                test_data_loader = torch.utils.data.DataLoader(test_dataset, batch_size=1, shuffle=False, num_workers=cfg.num_workers)

                inference = Inference(cfg, net_small, net_big, test_data_loader, saved_file_tile_dir)
                inference.main()
            else:
                for col in range(col_start, col_end + 1):
                    for row in range(row_start, row_end + 1):
                        merge_upper_level_tiles(col, row, level, tile_overlap, descriptor, saved_file_tile_dir, skip)
            
            min_col = min_col // 2
            min_row = min_row // 2
            max_col = max_col // 2
            max_row = max_row // 2
            level = level - 1