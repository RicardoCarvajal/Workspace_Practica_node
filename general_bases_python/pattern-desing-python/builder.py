class Computer:
    def __init__(self):
        self.cpu = None
        self.ram = None
        self.storage = None
        self.gpu = None

    def __str__(self):
        return (f'Caracteristicas del computador: CPU: {self.cpu}, RAM: {self.ram}, STORAGE: {self.storage}, GPU: {self.gpu}')


class ComputerBuilder:
    def __init__(self):
        self.computer = Computer()

    def cpu(self, cpu : str):
        self.computer.cpu = cpu
        return self

    def ram(self, ram : str):
        self.computer.ram = ram
        return self

    def storage(self, storage : str):
        self.computer.storage = storage
        return self

    def gpu(self, gpu : str):
        self.computer.gpu = gpu
        return self     

    def build(self):
        return self.computer       

if __name__ == "__main__":
    pc_one = ComputerBuilder().cpu("Intel Core i9-14700K").ram("32GB DDR5").storage("2TB NVMe SSD").gpu("NVIDIA GeForce RTX 4070").build()    
    print(pc_one)   