const joyasList = document.getElementById('joyasList');
const addJoyaBtn = document.getElementById('addJoyaBtn');
const addJoyaForm = document.getElementById('addJoyaForm');
const joyaForm = document.getElementById('joyaForm');
const closeBtn = document.getElementById('closeBtn');
//const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

// Mostrar las joyas desde la API
async function loadJoyas() {
  try {
    const response = await fetch('/joyas');
    if (!response.ok) {
      throw new Error('Error al cargar las joyas');
    }

    const joyas = await response.json();

    // Verificar si la respuesta es un arreglo de joyas
    if (!Array.isArray(joyas)) {
      throw new Error('La respuesta no es un arreglo de joyas');
    }

    joyasList.innerHTML = ''; // Limpiar la lista antes de agregar nuevos elementos
    joyas.forEach((joya) => {
      const div = document.createElement('div');
      div.className = 'joya';
      div.dataset.id = joya._id; // ID oculto para el manejo interno

      div.innerHTML = `
        <h3 class="clickable">${joya.nombre}</h3>
        <p>${joya.descripcion}</p>
        <p>Precio: $${joya.precio}</p>
        <p>Material: ${joya.material}</p>
        <p>Categoría: ${joya.categoria}</p>
        <p>En Stock: ${joya.en_stock ? 'Sí' : 'No'}</p>
        ${joya.imagen ? `<img src="${joya.imagen}" alt="${joya.nombre}" class="clickable" />` : ''}
      `;

      div.addEventListener('click', () => openActionForm(joya)); // Abrir el formulario de acciones
      joyasList.appendChild(div);
    });
  } catch (error) {
    console.error('Error al cargar las joyas:', error);
  }
}

// Obtener referencias a los elementos
const actionForm = document.getElementById('action-form');
const closeActionFormBtn = document.getElementById('close-action-form');

// Función para abrir el formulario de acciones
function openActionForm(joya) {
  actionForm.style.display = 'block';
  document.getElementById('action-joya-nombre').textContent = `Joya seleccionada: ${joya.nombre}`;

  document.getElementById('modify-button').onclick = () => openEditForm(joya);
  document.getElementById('delete-button').onclick = () => deleteJoya(joya);
}

// Función para cerrar el formulario de acciones
function closeActionForm() {
  actionForm.style.display = 'none';
}

// Cerrar el formulario cuando se haga clic en la 'X'
closeActionFormBtn.addEventListener('click', closeActionForm);

// También cerrar si se hace clic fuera del formulario
window.addEventListener('click', (event) => {
  if (event.target === actionForm) {
    closeActionForm();
  }
});


// Mostrar el formulario de edición
function openEditForm(joya) {
  const editForm = document.getElementById('edit-form');
  editForm.style.display = 'block';

  // Precargar los valores de la joya
  document.getElementById('edit-nombre').value = joya.nombre;
  document.getElementById('edit-descripcion').value = joya.descripcion;
  document.getElementById('edit-precio').value = joya.precio;
  document.getElementById('edit-material').value = joya.material;
  document.getElementById('edit-categoria').value = joya.categoria;
  document.getElementById('edit-en_stock').checked = joya.en_stock;

  // Guardar cambios
  const saveButton = document.getElementById('edit-save');
  saveButton.onclick = () => saveJoyaChanges(joya._id);
}

// Guardar los cambios de la joya
async function saveJoyaChanges(joyaId) {
  const updatedData = {
    nombre: document.getElementById('edit-nombre').value,
    descripcion: document.getElementById('edit-descripcion').value,
    precio: document.getElementById('edit-precio').value,
    material: document.getElementById('edit-material').value,
    categoria: document.getElementById('edit-categoria').value,
    en_stock: document.getElementById('edit-en_stock').checked,
  };

  try {
    const response = await fetch(`/joyas/${joyaId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (response.ok) {
      alert('Joya actualizada con éxito.');
      document.getElementById('edit-form').style.display = 'none'; // Ocultar formulario
      loadJoyas(); // Recargar la lista de joyas
      closeActionForm();
    } else {
      throw new Error('Error al actualizar la joya.');
    }
  } catch (error) {
    console.error('Error al actualizar la joya:', error);
  }
}

// Eliminar la joya
async function deleteJoya(joya) {
  if (confirm(`¿Estás seguro de que deseas eliminar "${joya.nombre}"?`)) {
    try {
      const response = await fetch(`/joyas/${joya._id}`, { method: 'DELETE' });
      if (response.ok) {
        alert('Joya eliminada con éxito.');
        loadJoyas(); // Recargar la lista de joyas
        closeActionForm();
      } else {
        throw new Error('Error al eliminar la joya.');
      }
    } catch (error) {
      console.error('Error al eliminar la joya:', error);
    }
  }
}

// Mostrar formulario para agregar una nueva joya
addJoyaBtn.addEventListener('click', () => {
  addJoyaForm.style.display = 'flex';
});

// Cerrar el formulario al hacer clic en la "X"
closeBtn.addEventListener('click', () => {
  addJoyaForm.style.display = 'none';
});

// Enviar el formulario para agregar una nueva joya
joyaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Obtener datos del formulario
  const nombre = document.getElementById('nombre').value;
  const descripcion = document.getElementById('descripcion').value;
  const precio = parseFloat(document.getElementById('precio').value);
  const material = document.getElementById('material').value;
  const enStock = document.getElementById('en_stock').checked;
  const categoria = document.getElementById('categoria').value;
  const imagen = document.getElementById('imagen').files[0];

  // Validar los campos
  if (!nombre || !descripcion || isNaN(precio) || precio <= 0 || !material || !categoria) {
   alert("Por favor, completa todos los campos con valores válidos.");
    return;
  }

  // Crear FormData con los datos del formulario
  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('descripcion', descripcion);
  formData.append('precio', precio);
  formData.append('material', material);
  formData.append('en_stock', enStock);
  formData.append('categoria', categoria);
  if (imagen) {
    formData.append('imagen', imagen);
  }

  try {
    // Enviar la nueva joya a la API
    const response = await fetch('/joyas', {
      method: 'POST',
      body: formData,
    });
    // Verificar si la respuesta es correcta
    if (!response.ok) {
      const errorText = await response.text(); // Obtener respuesta del servidor
      throw new Error(`Error al guardar la joya: ${errorText}`);
    }

    alert('Joya agregada con éxito.');
    loadJoyas();
    addJoyaForm.style.display = 'none';
  } catch (error) {
    console.error("Error al guardar la joya:", error);
    alert(`Error: ${error.message}`); // Mostrar mensaje de error más detallado
  }
});

