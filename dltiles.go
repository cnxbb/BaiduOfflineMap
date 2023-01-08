package main

import (
	"bufio"
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"io"
	"net/http"
	"os"
	"time"
)

//下载参数
type Job struct {
	Id   int
	Url  string
	Path string
	File string
}

//下载结果参数
type Result struct {
	Id  int
	Err error
}

//下载文件
func downFile(url string, path string, fn string) error {
	err := os.MkdirAll(path, 0777)
	if err != nil {
		fmt.Printf("Mkdir Error:%v\n", err)
		return err
	}

	fmt.Printf("Start Download %s\n", url)
	res, err := http.Get(url)
	if err != nil {
		fmt.Printf("Download URL:%s\tFail\n", url)
		return err
	}
	defer res.Body.Close()

	reader := bufio.NewReaderSize(res.Body, 64*1024)
	file, err := os.Create(path + fn)
	if err != nil {
		fmt.Printf("Create File:%s Fail Err:%v\n", path+fn, err)
		return err
	}

	writer := bufio.NewWriter(file)
	_, err = io.Copy(writer, reader)
	if err != nil {
		fmt.Printf("Write File:%s Fail Err:%v\n", path+fn, err)
		return err
	}

	fmt.Printf("%s -> %s OK\n", url, path+fn)
	return nil
}

//------------------------------------------------------------------------------------

//下载工作池
func DownloadPool(size int, jobChan chan *Job, retChan chan *Result) {
	for i := 0; i < size; i++ {
		go func(jobChan chan *Job, retChan chan *Result) {
			for job := range jobChan {
				err := downFile(job.Url, job.Path, job.File)
				r := &Result{
					Id:  job.Id,
					Err: err,
				}
				retChan <- r
			}
		}(jobChan, retChan)
	}
}

//------------------------------------------------------------------------------------

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}

//用时统计
func timeCost(start time.Time) {
	tc := time.Since(start)
	fmt.Printf("Time total: %v\n", tc)
}

func main() {
	//命令行参数处理
	if len(os.Args) < 3 {
		fmt.Println("dltiles [sqlite-file] [save-path]")
		os.Exit(0)
	}
	dbfile := os.Args[1]
	fmt.Printf("SQLite:%s\n", dbfile)
	path := os.Args[2]
	fmt.Printf("Save Path:%s\n", path)

	//准备下载工作
	jobChan := make(chan *Job, 256)
	retChan := make(chan *Result, 256)
	doneChan := make(chan int)
	DownloadPool(128, jobChan, retChan)

	t := time.Now()
	fmt.Printf("Time start: %s\n", t.Format("2006-01-02 15:04:05"))
	defer timeCost(t)

	//打开数据库
	db, err := sql.Open("sqlite3", dbfile)
	checkErr(err)

	//获取需要下载的瓦片数
	rows, err := db.Query("select count(*) as num from tiles")
	var Total int
	rows.Next()
	rows.Scan(&Total)
	rows.Close()
	fmt.Printf("Total: %d\n", Total)

	//下载结果计数
	go func(retChan chan *Result, total int, done chan int) {
		var iDone int
		for result := range retChan {
			if result.Err == nil {
				fmt.Printf("Job:%v Done\n", result.Id)
			} else {
				fmt.Printf("Job:%v Fail\t Err:%v\n", result.Id, result.Err)
			}
			iDone++
			if iDone == total {
				done <- 1
			}
		}
	}(retChan, Total, doneChan)

	//从sqlite取下载URL
	rows, err = db.Query("select * from tiles")
	checkErr(err)
	for rows.Next() {
		var id int
		var flag int
		var z int
		var x int
		var y int
		err = rows.Scan(&id, &flag, &z, &x, &y)
		checkErr(err)
		url := fmt.Sprintf("http://online3.map.bdimg.com/tile/?qt=vtile&x=%d&y=%d&z=%d&styles=pl&scaler=1", x, y, z)
		spath := fmt.Sprintf("%s/%d/%d/", path, z, x)
		sfn := fmt.Sprintf("%d.png", y)
		job := &Job{
			Id:   id,
			Url:  url,
			Path: spath,
			File: sfn,
		}
		jobChan <- job
	}
	db.Close()
	<-doneChan
}
