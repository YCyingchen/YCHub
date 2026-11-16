package fbhttp

import (
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/shirou/gopsutil/v4/disk"

	"github.com/filebrowser/filebrowser/v2/files"
)

// VolumeInfo describes one entry shown under "我的文件" in the sidebar tree.
// A mount is an independent storage volume (e.g. /vol1, /vol2 on fnOS); a
// plain directory is a normal folder at the root of the user's scope.
type VolumeInfo struct {
	Name  string `json:"name"`
	Path  string `json:"path"`
	Mount bool   `json:"mount"`
	Total uint64 `json:"total"`
	Used  uint64 `json:"used"`
}

var volumeNumber = regexp.MustCompile(`(\d+)$`)

func cleanRealPath(p string) string {
	return strings.ToLower(filepath.Clean(p))
}

func naturalPathLess(a, b string) bool {
	na, erra := strconv.Atoi(volumeNumber.FindString(filepath.Base(a)))
	nb, errb := strconv.Atoi(volumeNumber.FindString(filepath.Base(b)))
	if erra == nil && errb == nil && na != nb {
		return na < nb
	}
	if erra == nil && errb != nil {
		return true
	}
	if erra != nil && errb == nil {
		return false
	}
	return a < b
}

var volumesGetHandler = withUser(func(w http.ResponseWriter, r *http.Request, d *data) (int, error) {
	root, err := files.NewFileInfo(&files.FileOptions{
		Fs:         d.user.Fs,
		Path:       "/",
		Modify:     d.user.Perm.Modify,
		Expand:     false,
		ReadHeader: false,
		Checker:    d,
		Content:    false,
	})
	if err != nil {
		return errToStatus(err), err
	}
	if !root.IsDir {
		return renderJSON(w, r, []VolumeInfo{})
	}

	scopeReal := root.RealPath()

	mounts := make(map[string]bool)
	if parts, perr := disk.Partitions(false); perr == nil {
		for _, p := range parts {
			if p.Mountpoint == "" {
				continue
			}
			mounts[cleanRealPath(p.Mountpoint)] = true
		}
	}

	entries, err := os.ReadDir(scopeReal)
	if err != nil {
		return errToStatus(err), err
	}

	volumes := make([]VolumeInfo, 0, len(entries))
	numbered := make(map[int]bool)

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		name := entry.Name()
		childReal := filepath.Join(scopeReal, name)

		if mounts[cleanRealPath(childReal)] {
			number := 0
			if m := volumeNumber.FindStringSubmatch(name); m != nil {
				number, _ = strconv.Atoi(m[1])
			}
			for number <= 0 || numbered[number] {
				number++
			}
			numbered[number] = true

			var total, used uint64
			if usage, uerr := disk.UsageWithContext(r.Context(), childReal); uerr == nil {
				total = usage.Total
				used = usage.Used
			}
			volumes = append(volumes, VolumeInfo{
				Name:  "存储空间 " + strconv.Itoa(number),
				Path:  "/" + name,
				Mount: true,
				Total: total,
				Used:  used,
			})
			continue
		}

		volumes = append(volumes, VolumeInfo{
			Name:  name,
			Path:  "/" + name,
			Mount: false,
		})
	}

	sort.SliceStable(volumes, func(i, j int) bool {
		if volumes[i].Mount != volumes[j].Mount {
			return volumes[i].Mount
		}
		return naturalPathLess(volumes[i].Path, volumes[j].Path)
	})

	return renderJSON(w, r, volumes)
})
