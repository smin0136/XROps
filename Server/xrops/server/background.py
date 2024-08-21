import threading
import asyncio

from importlib import import_module
from PyQt5.QtCore import pyqtSlot, pyqtSignal, QObject, Qt


class Transfer:
    module_name: str
    func_name: str
    args:list

    def __init__(self, module_name, func_name, args):
        self.module_name = module_name
        self.func_name = func_name
        self.args = args


class Background(QObject):

    def start(self):
        self.thread = threading.Thread(target=self.run)
        self.thread.start()

    def run(self):
        print("Background Task Started!")

    @pyqtSlot(object)
    def execute_func(self, transfer:Transfer):
        func = getattr(import_module(transfer.module_name), transfer.func_name)
        asyncio.create_task(func(*transfer.args))


class Signal(QObject):
    throw_signal = pyqtSignal(object)

signal = Signal()
background = Background()
