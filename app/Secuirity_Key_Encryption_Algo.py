import os
import uuid
from getmac import get_mac_address
from .Encryption_Algo_Dict import Fluid_table, Number_division_table, keyOperator
import bcrypt
from datetime import datetime

def convert_pwd_in_array(password):
    concat_values = ""
    print("Encryption is Started..........")
    print(password)
    for char in password:
        if char in Fluid_table:
            concat_values += Fluid_table[char]
    return password_conversion_char_array(concat_values)

def get_system_hardware_info():
    random_generate_system_key = uuid.getnode()
    mac_address = get_mac_address()
    print("Mac Address: {}".format(mac_address))
    return mac_address, random_generate_system_key

def password_conversion_char_array(values):
    filter_num = ""
    for char in values:
        if char in Number_division_table:
            filter_num += Number_division_table[char]
    print(filter_num)
    return break_string(filter_num)

def break_string(filter_num):
    replacement_array = []
    break_point = list(filter_num.strip())
    for point in break_point:
        if point in keyOperator:
            replacement_array.append(keyOperator[point])
        else:
            print("Something went wrong")
    print("Replacement Array: ",replacement_array)
    return replacement_array_in_binary(replacement_array)

def replacement_array_in_binary(replacement_array):
    binary_list = []
    for item in replacement_array:
        binary_value = '000000' if item == 'NUL' else format(ord(item), '06b')
        binary_list.append(binary_value)
    return fluid_encrypt(binary_list)

def fluid_encrypt(binary_list):
    bit_list = [int(bit) for binary_string in binary_list for bit in binary_string]

    if len(bit_list) < 6:
        print("Error: Not enough bits for operation")
        return None

    xor_results = [bit_list[i] ^ bit_list[i + 1] for i in range(len(bit_list) - 1)]
    xor_and_results = [xor_results[i] ^ xor_results[i + 1] for i in range(len(xor_results) - 1)]
    xor_result_final = xor_and_results[0] if xor_and_results else 0
    original_bit = bit_list[0]
    mac_address = get_mac_address()
    system_info = get_system_hardware_info()
    print("Encryption MAC Address: ", mac_address)
    print("Encryption System Info: ", system_info)
    print("Encrypted Bit: ", original_bit)
    print("Encrypted Password Pattern: ", xor_results)
    
    # Return encrypted data instead of immediately decrypting
    return {
        'xor_results': xor_results,
        'original_bit': original_bit,
        'mac_address': mac_address,
        'system_info': system_info
    }

def reverse_fluid_encrypt(xor_results, original_bit, mac_address, system_info):
    print("Now Decryption is Started.........")
    if mac_address == get_mac_address() and system_info == get_system_hardware_info():
        reversed_bits = [original_bit]
        print("Decryption MAC Address: ", mac_address)
        print("Decryption System Info: ", system_info)
        print("Decrypted Bits: ", reversed_bits)
        for i in range(len(xor_results)):
            next_bit = xor_results[i] ^ reversed_bits[-1]
            reversed_bits.append(next_bit)

        grouped_bits = []
        for i in range(0, len(reversed_bits), 6):
            chunk = reversed_bits[i:i + 6]
            if len(chunk) < 6:
                continue
            combined_value = sum(bit << (5 - j) for j, bit in enumerate(chunk))
            grouped_bits.append(combined_value)

        grouped_bits = [1 if value == 63 else value for value in grouped_bits]
        decrypted_string = ''.join(chr(value + ord(' ')) for value in grouped_bits)
        print("Decrypted String: ", decrypted_string)
        combined_list = []

        for i in range(0, len(grouped_bits), 10):
            combined_string = ''.join(str(grouped_bits[j]) for j in range(i, min(i + 10, len(grouped_bits))))
            combined_list.append(combined_string)

        replaced_list = []
        for combined_item in combined_list:
            matched_key = None
            for key, num_value in Number_division_table.items():
                if num_value == combined_item:
                    matched_key = key
                    break
            replaced_list.append(matched_key if matched_key else combined_item)

        new_combined_list = combine_elements(replaced_list, 12)
        print("Comnined List: ",new_combined_list)
        return replace_with_fluid_keys(new_combined_list)
    else:
        print("Unauthorized Access.... Decryption Denied........", get_mac_address())
        return None

def replace_with_fluid_keys(new_combined_list):
    replaced_with_keys = []
    for combined_item in new_combined_list:
        matched_key = None
        for key, value in Fluid_table.items():
            if value == combined_item:
                matched_key = key
                break
        replaced_with_keys.append(matched_key if matched_key else combined_item)

    Decrypted_string = "".join(replaced_with_keys)
    print(f"Decrypted string: {Decrypted_string}")
    return Decrypted_string

def combine_elements(replaced_list, group_size):
    new_combined_list = []
    for i in range(0, len(replaced_list), group_size):
        combined_string = ''.join(replaced_list[i:i + group_size])
        new_combined_list.append(combined_string)
    return new_combined_list

if __name__ == "__main__":
    password = "gaurav1324@@"
    decrypted_string = convert_pwd_in_array(password)
    print("Decrypted string in main:", decrypted_string)
    accuracy = (decrypted_string == password) * 100
    print(f"Decryption Accuracy: {accuracy}%")