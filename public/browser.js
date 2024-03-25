let skip=0;
window.onload=generatetodos();

function generatetodos(){
   axios.get(`/read-item?skip=${skip}`).then((res)=>{
    console.log(res)
    const todos=res.data.data;
    if(res.data.status!==200){
        alert(res.data.message)
    }
    document.getElementById("item-list").insertAdjacentHTML("beforeend",todos.map((item)=>{
        return`<li>
        <span class="text">${item.todo}</span>
        <button data-id=${item._id} class="edit">edit</button>
        <button data-id=${item._id} class="delete">delete</button>
        </li>`
    }).join(""))
    skip+=todos.length;
   }).catch(err=>{
    console.log(err)
    alert(err.message)
   })
}
document.addEventListener("click",function(event){
    if(event.target.classList.contains("edit")){
        const newdata=prompt("enter new todo");
        const id=event.target.getAttribute("data-id");
        axios.post("/edit-item",{id,newdata}).then((res)=>{
            if(res.data.status!==200){
                alert(res.data.message)
            }
            event.target.parentElement.querySelector(".text").innerHTML=newdata;
        // console.log(event.target.parentElement.parentElement.querySelector(".text"))
        })
    }
    else if(event.target.classList.contains("delete")){
        const id=event.target.getAttribute("data-id");
       axios.post("/delete-item",{id}).then((res)=>{
        console.log(res)
        if(res.data.status!==200){
            alert(res.data.message)
            return;
        }
        event.target.parentElement.remove()
        return;
       }).catch((err)=>{
        console.log(err)
       })
    }
    else if(event.target.classList.contains("add-item")){
        const todo=document.getElementById("create-field").value
        axios.post("/create-item",{todo}).then((res)=>{
        console.log(res)
        if(res.data.status!==201){
            alert(res.data.message)
        }
        document.getElementById("create-field").value="";
        document.getElementById("item-list").insertAdjacentHTML("beforeend",
            `<li>
            <span class="text">${res.data.data.todo}</span>
            <button data-id=${res.data.data._id} class="edit">edit</button>
            <button data-id=${res.data.data._id} class="delete">delete</button>
            </li>`)
        }).catch((err)=>{
            console.log(err)
        })
    }
    else if(event.target.classList.contains("show_more")){
     generatetodos();
    }
})