let data = [];
let pieChart;
let currentEditIndex = -1; // Düzenleme modunda olup olmadığını takip etmek için

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    initializeChart();
    loadFromLocalStorage();
    updateUI();
});

// Grafik başlatma
function initializeChart() {
    let ctx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pass', 'Fail'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Veri ekleme/güncelleme
function addData() {
    let feature = document.getElementById("feature").value.trim();
    let total = parseInt(document.getElementById("total").value);
    let pass = parseInt(document.getElementById("pass").value);
    let fail = parseInt(document.getElementById("fail").value);

    // Validasyon
    if (!feature || isNaN(total) || isNaN(pass) || isNaN(fail)) {
        alert("Lütfen tüm alanları doğru şekilde doldurun.");
        return;
    }

    if (pass + fail !== total) {
        alert("Pass ve Fail toplamı, Toplam Senaryo sayısına eşit olmalıdır.");
        return;
    }

    if (currentEditIndex === -1) {
        // Yeni kayıt ekleme
        data.push({ feature, total, pass, fail });
    } else {
        // Mevcut kaydı güncelleme
        data[currentEditIndex] = { feature, total, pass, fail };
        currentEditIndex = -1; // Düzenleme modundan çık
        document.querySelector('.btn-primary i').className = 'fas fa-plus';
        document.querySelector('.btn-primary').textContent = ' Ekle';
    }

    saveToLocalStorage();
    updateUI();
    clearForm();
}

function deleteAllData() {
    if (confirm('Tüm kayıtları silmek istediğinize emin misiniz?')) {
      data = [];
      localStorage.removeItem('testAutomationData');
      updateUI();
    }
  }

// Tabloyu güncelleme
function updateTable() {
    let table = document.getElementById("dataTable");
    table.innerHTML = "";
    
    data.forEach((item, index) => {
        let row = document.createElement("tr");
        
        row.innerHTML = `
            <td>${item.feature}</td>
            <td>${item.total}</td>
            <td>${item.pass}</td>
            <td>${item.fail}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="prepareEdit(${index})"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteData(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        
        table.appendChild(row);
    });
}

// Düzenleme için hazırlık
function prepareEdit(index) {
    let item = data[index];
    currentEditIndex = index;
    
    // Formu doldur
    document.getElementById("feature").value = item.feature;
    document.getElementById("total").value = item.total;
    document.getElementById("pass").value = item.pass;
    document.getElementById("fail").value = item.fail;
    
    // Butonu güncelleme moduna al
    document.querySelector('.btn-primary i').className = 'fas fa-save';
    document.querySelector('.btn-primary').textContent = ' Güncelle';
}

// Veri silme
function deleteData(index) {
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
        data.splice(index, 1);
        
        // Eğer silinen kayıt düzenlenmekte olan kayıtsa
        if (currentEditIndex === index) {
            currentEditIndex = -1;
            clearForm();
            document.querySelector('.btn-primary i').className = 'fas fa-plus';
            document.querySelector('.btn-primary').textContent = ' Ekle';
        }
        
        saveToLocalStorage();
        updateUI();
    }
}

// Özet istatistikleri güncelleme
function updateSummary() {
    let totalScenarios = data.reduce((sum, item) => sum + item.total, 0);
    let totalPass = data.reduce((sum, item) => sum + item.pass, 0);
    let totalFail = data.reduce((sum, item) => sum + item.fail, 0);

    document.getElementById("totalScenarios").textContent = totalScenarios;
    document.getElementById("totalPass").textContent = totalPass;
    document.getElementById("totalFail").textContent = totalFail;
}

// Grafikleri güncelleme
function updateCharts() {
    let totalPass = data.reduce((sum, item) => sum + item.pass, 0);
    let totalFail = data.reduce((sum, item) => sum + item.fail, 0);
    
    // Pasta grafiğini güncelle
    pieChart.data.datasets[0].data = [totalPass, totalFail];
    pieChart.update();
    
    // Pass Rate güncelleme
    let total = totalPass + totalFail;
    let passRate = total > 0 ? Math.round((totalPass / total) * 100) : 0;
    
    document.getElementById("passRateBar").style.width = `${passRate}%`;
    document.getElementById("passRateText").textContent = `${passRate}%`;
}

// Formu temizleme
function clearForm() {
    document.getElementById("feature").value = "";
    document.getElementById("total").value = "";
    document.getElementById("pass").value = "";
    document.getElementById("fail").value = "";
}

// Tüm UI'yı güncelleme
function updateUI() {
    updateTable();
    updateSummary();
    updateCharts();
}

// LocalStorage'dan yükleme
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('testAutomationData');
    if (savedData) {
        data = JSON.parse(savedData);
    }
}

// LocalStorage'a kaydetme
function saveToLocalStorage() {
    localStorage.setItem('testAutomationData', JSON.stringify(data));
}

// ----- Geliştirilmiş Excel'e Aktarma -----
function exportToExcel() {
    if (data.length === 0) {
        alert("Aktarılacak veri bulunamadı.");
        return;
    }
    // Özet değerleri hesapla
    const totalScenarios = data.reduce((sum, item) => sum + item.total, 0);
    const totalPass      = data.reduce((sum, item) => sum + item.pass, 0);
    const totalFail      = data.reduce((sum, item) => sum + item.fail, 0);
    const passRate       = totalScenarios ? Math.round((totalPass / totalScenarios) * 100) : 0;

    const wb = XLSX.utils.book_new();

    // 1) Test Senaryoları sayfası
    const headers = ['Feature', 'Toplam Senaryo', 'Pass', 'Fail'];
    const wsData  = [headers, ...data.map(item => [item.feature, item.total, item.pass, item.fail])];
    const ws1     = XLSX.utils.aoa_to_sheet(wsData);

    // Başlık satırını stilize et
    const range1 = XLSX.utils.decode_range(ws1['!ref']);
    for (let C = range1.s.c; C <= range1.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({r: range1.s.r, c: C});
        if (!ws1[cell]) continue;
        ws1[cell].s = {
            font:      { bold: true },
            fill:      { fgColor: { rgb: 'FFEEEEEE' } },
            alignment: { horizontal: 'center' }
        };
    }
    XLSX.utils.book_append_sheet(wb, ws1, 'Test Senaryoları');

    // 2) Özet sayfası
    const summaryData = [
        ['Özet Bilgi',      'Değer'],
        ['Toplam Senaryo',  totalScenarios],
        ['Toplam Pass',     totalPass],
        ['Toplam Fail',     totalFail],
        ['Pass Rate (%)',   `${passRate}%`]
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    const range2 = XLSX.utils.decode_range(ws2['!ref']);
    // İlk satırı kalın yap
    for (let C = range2.s.c; C <= range2.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({r: range2.s.r, c: C});
        if (!ws2[cell]) continue;
        ws2[cell].s = { font: { bold: true } };
    }
    ws2['!cols'] = [{wch:20},{wch:15}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Özet');

    // Dosyayı yaz
    XLSX.writeFile(wb, 'test_sonuclari.xlsx', { bookType: 'xlsx', cellStyles: true });
}

// ----- Geliştirilmiş Excel'den Yükleme -----
function importFromExcel() {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const buffer   = await file.arrayBuffer();
        const wb       = XLSX.read(buffer, { type: 'array' });

        // Birden fazla sheet varsa kullanıcıdan seçmesini iste
        let sheetName = wb.SheetNames[0];
        if (wb.SheetNames.length > 1) {
            sheetName = prompt(
                `Bir sayfa seçin:\n${wb.SheetNames.join('\n')}`,
                sheetName
            );
            if (!sheetName || !wb.SheetNames.includes(sheetName)) {
                alert('Geçersiz sayfa adı.');
                return;
            }
        }

        const sheet = wb.Sheets[sheetName];
        const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length < 2) {
            alert('Excel dosyasında veri bulunamadı.');
            return;
        }

        // Başlık kontrolü
        const headers = rows[0];
        const required = ['Feature', 'Toplam Senaryo', 'Pass', 'Fail'];
        const idxMap = {};
        for (const col of required) {
            const idx = headers.indexOf(col);
            if (idx === -1) {
                alert(`Eksik sütun: ${col}`);
                return;
            }
            idxMap[col] = idx;
        }

        // Veriyi parse et
        const imported = rows.slice(1).map(r => ({
            feature: r[idxMap['Feature']],
            total:   Number(r[idxMap['Toplam Senaryo']]) || 0,
            pass:    Number(r[idxMap['Pass']])           || 0,
            fail:    Number(r[idxMap['Fail']])           || 0
        }));

        // Konsolda önizleme
        console.table(imported);

        if (imported.length) {
            const replace = confirm(
                `${imported.length} kayıt bulundu.\n` +
                `Tamam: Üzerine yaz\n` +
                `İptal: Mevcutlara ekle`
            );
            data = replace ? imported : data.concat(imported);
            saveToLocalStorage();
            updateUI();
            alert('Veriler başarıyla güncellendi.');
        } else {
            alert('İçe aktarılacak veri bulunamadı.');
        }
    };
    input.click();
}