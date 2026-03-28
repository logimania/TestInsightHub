#include "utils.h"
#include "handler.h"

int calculateSum(int a, int b) {
    return a + b;
}

void processData(const std::string& data) {
    if (data.empty()) {
        return;
    }
    std::cout << data << std::endl;
}

std::string formatOutput(int value) {
    return std::to_string(value);
}
