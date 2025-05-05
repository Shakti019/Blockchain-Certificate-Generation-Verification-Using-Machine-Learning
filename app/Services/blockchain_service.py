from web3 import Web3
from flask import current_app
import json


class BlockchainService:
    def __init__(self):
        self.w3 = None
        self.contract = None
        self.connect()

    def connect(self):
        try:
            self.w3 = Web3(Web3.HTTPProvider(current_app.config['BLOCKCHAIN_RPC']))
            if not self.w3.is_connected():
                raise ConnectionError("Could not connect to blockchain node")

            with open(current_app.config['CONTRACT_ABI_PATH'], 'r') as abi_file:
                contract_abi = json.load(abi_file)

            self.contract = self.w3.eth.contract(
                address=current_app.config['CONTRACT_ADDRESS'],
                abi=contract_abi
            )
        except Exception as e:
            current_app.logger.error(f"Blockchain connection error: {str(e)}")
            raise

    def issue_certificate(self, cert_id, student_name, degree_program, ipfs_hash):
        try:
            # Convert certificate ID to bytes32
            cert_id_bytes = Web3.toBytes(hexstr=Web3.keccak(text=cert_id).hex())

            # Build transaction
            nonce = self.w3.eth.getTransactionCount(current_app.config['ADMIN_ADDRESS'])
            tx = self.contract.functions.issueCertificate(
                cert_id_bytes,
                student_name,
                degree_program,
                ipfs_hash  # Storing IPFS hash on-chain
            ).buildTransaction({
                'chainId': current_app.config['CHAIN_ID'],
                'gas': 500000,
                'gasPrice': self.w3.toWei(current_app.config['GAS_PRICE'], 'gwei'),
                'nonce': nonce
            })

            # Sign and send transaction
            signed_tx = self.w3.eth.account.sign_transaction(
                tx,
                current_app.config['ADMIN_PRIVATE_KEY']
            )
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                'tx_hash': receipt.transactionHash.hex(),
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed
            }
        except Exception as e:
            current_app.logger.error(f"Blockchain transaction error: {str(e)}")
            raise