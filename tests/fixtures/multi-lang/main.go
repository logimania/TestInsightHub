package main

import (
	"fmt"
	"net/http"
)

func main() {
	fmt.Println("Hello")
}

func handleRequest(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		return
	}
	w.Write([]byte("OK"))
}

func calculateSum(a, b int) int {
	return a + b
}
